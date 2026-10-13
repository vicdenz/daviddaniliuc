import assert from "node:assert/strict";
import { readFile, open, stat } from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";
import { test } from "node:test";

// Run against a local server with the manifest's MP3s restored. These tests
// exercise HTTP request contexts; they do not replace browser/device testing.
const base = new URL(process.env.AUDIO_TEST_BASE_URL ?? "http://localhost:3000");
const tracks = JSON.parse(await readFile(new URL("../private/audio/tracks.json", import.meta.url), "utf8"));
const mediaHeaders = { "sec-fetch-site": "same-origin", "sec-fetch-dest": "audio", "sec-fetch-mode": "no-cors" };

async function session() {
	const response = await fetch(new URL("/api/audio/session", base), {
		method: "POST", headers: { Origin: base.origin, "sec-fetch-site": "same-origin" },
		signal: AbortSignal.timeout(8000),
	});
	assert.equal(response.status, 204);
	assert.equal(response.headers.get("cache-control"), "private, no-store");
	const cookie = response.headers.get("set-cookie")?.split(";")[0];
	assert.ok(cookie?.startsWith("audio_session="), "Session cookie must be issued");
	return cookie;
}


function request(track, headers = {}, method = "GET") {
	// Unlike fetch, this preserves Sec-Fetch-Mode exactly, including navigate.
	const send = base.protocol === "https:" ? httpsRequest : httpRequest;
	return new Promise((resolve, reject) => {
		const outgoing = send(new URL(`/api/audio/${track.id}`, base), {
			method, headers, timeout: 8000,
		}, (incoming) => {
			const responseHeaders = new Headers();
			for (const [name, value] of Object.entries(incoming.headers)) {
				if (value !== undefined) responseHeaders.set(name, Array.isArray(value) ? value.join(", ") : value);
			}
			if (method === "HEAD") incoming.resume();
			resolve(new Response(method === "HEAD" ? null : Readable.toWeb(incoming), {
				status: incoming.statusCode, headers: responseHeaders,
			}));
		});
		outgoing.on("error", reject);
		outgoing.on("timeout", () => outgoing.destroy(new Error("Audio request timed out")));
		outgoing.end();
	});
}

async function expectedBytes(track, start, length) {
	const file = await open(new URL(`../private/audio/${track.filename}`, import.meta.url));
	try {
		const buffer = Buffer.alloc(length);
		const { bytesRead } = await file.read(buffer, 0, length, start);
		return buffer.subarray(0, bytesRead);
	} finally { await file.close(); }
}

for (const track of tracks) {
	test(`${track.id}: bare URLs and browser navigation remain blocked after visiting the player`, async () => {
		const cookie = await session();
		for (const headers of [{}, { Cookie: cookie },
			{ Cookie: cookie, "sec-fetch-dest": "document", "sec-fetch-site": "none", "sec-fetch-mode": "navigate" },
			{ Cookie: cookie, "sec-fetch-dest": "document", "sec-fetch-site": "same-origin" },
			{ Cookie: cookie, Referer: `${base.origin}/music`, Range: "bytes=0-", "sec-fetch-mode": "navigate" },
			{ Cookie: cookie, ...mediaHeaders, "sec-fetch-site": "cross-site" }]) {
			const response = await request(track, headers);
			assert.equal(response.status, 403);
			assert.equal(response.headers.get("cache-control"), "private, no-store");
			assert.equal((await response.arrayBuffer()).byteLength, 0);
		}
		const head = await request(track, { Cookie: cookie, "sec-fetch-dest": "document" }, "HEAD");
		assert.equal(head.status, 403);
		const unauthorized = await request(track, mediaHeaders);
		assert.equal(unauthorized.status, 403);
		const invalidSession = await request(track, { ...mediaHeaders, Cookie: "audio_session=invalid", Range: "bytes=0-1" });
		assert.equal(invalidSession.status, 403);
	});

	test(`${track.id}: modern and legacy media request contexts receive uncorrupted startup bytes`, async () => {
		const cookie = await session();
		const size = (await stat(new URL(`../private/audio/${track.filename}`, import.meta.url))).size;
		const contexts = [
			{ name: "modern audio", headers: mediaHeaders },
			{ name: "legacy ranged media", headers: { Referer: `${base.origin}/music` } },
			{ name: "origin-only referrer", headers: { Referer: `${base.origin}/` } },
		];
		for (const { name, headers } of contexts) {
			const response = await request(track, { ...headers, Cookie: cookie, Range: "bytes=0-65535" });
			assert.equal(response.status, 206, name);
			assert.equal(response.headers.get("content-type"), "audio/mpeg", name);
			assert.equal(response.headers.get("content-range"), `bytes 0-65535/${size}`, name);
			assert.equal(response.headers.get("content-length"), "65536", name);
			assert.equal(response.headers.get("accept-ranges"), "bytes", name);
			assert.equal(response.headers.get("cache-control"), "private, no-store", name);
			assert.ok(response.headers.get("set-cookie")?.startsWith("audio_session="), name);
			assert.deepEqual(Buffer.from(await response.arrayBuffer()), await expectedBytes(track, 0, 65536), name);
		}
	});

	test(`${track.id}: seeking, suffix probes, HEAD, and invalid ranges work`, async () => {
		const cookie = await session();
		const size = (await stat(new URL(`../private/audio/${track.filename}`, import.meta.url))).size;
		const start = Math.floor(size / 2);
		for (const [range, offset, length] of [["bytes=0-1", 0, 2], [`bytes=${start}-${start + 1023}`, start, 1024], ["bytes=-1024", size - 1024, 1024]]) {
			const response = await request(track, { ...mediaHeaders, Cookie: cookie, Range: range });
			assert.equal(response.status, 206);
			assert.deepEqual(Buffer.from(await response.arrayBuffer()), await expectedBytes(track, offset, length));
		}
		const head = await request(track, { ...mediaHeaders, Cookie: cookie }, "HEAD");
		assert.equal(head.status, 200);
		assert.equal(head.headers.get("content-length"), String(size));
		assert.equal((await head.arrayBuffer()).byteLength, 0);
		const invalid = await request(track, { ...mediaHeaders, Cookie: cookie, Range: `bytes=${size}-` });
		assert.equal(invalid.status, 416);
		assert.equal(invalid.headers.get("content-range"), `bytes */${size}`);
	});
}

test("cancelling an open-ended stream does not break subsequent playback requests", async () => {
	const cookie = await session();
	const response = await request(tracks[0], { ...mediaHeaders, Cookie: cookie, Range: "bytes=0-" });
	assert.equal(response.status, 206);
	const reader = response.body.getReader();
	const first = await reader.read();
	assert.ok(first.value.byteLength > 0);
	await reader.cancel();
	const next = await request(tracks[1], { ...mediaHeaders, Cookie: cookie, Range: "bytes=0-1023" });
	assert.equal(next.status, 206);
	assert.equal((await next.arrayBuffer()).byteLength, 1024);
});

test("session requests from another origin are rejected", async () => {
	const response = await fetch(new URL("/api/audio/session", base), {
		method: "POST", headers: { Origin: "https://example.com", "sec-fetch-site": "cross-site" },
		signal: AbortSignal.timeout(8000),
	});
	assert.equal(response.status, 403);
});
