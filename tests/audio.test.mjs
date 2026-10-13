import assert from "node:assert/strict";
import { test } from "node:test";
import { AudioPlaybackRecovery, renewAudioSession } from "../src/lib/audio-playback.ts";
import { parseAudioRange } from "../src/lib/audio-range.ts";
import { isAudioPlaybackRequest } from "../src/lib/audio-request.ts";
import { createAudioSession, verifyAudioSession } from "../src/lib/audio-session.ts";

test("ranges support full responses, seeking, suffixes and end clamping", () => {
	assert.deepEqual(parseAudioRange(null, 100), { start: 0, end: 99, partial: false });
	assert.deepEqual(parseAudioRange("bytes=10-19", 100), { start: 10, end: 19, partial: true });
	assert.deepEqual(parseAudioRange("bytes=90-", 100), { start: 90, end: 99, partial: true });
	assert.deepEqual(parseAudioRange("bytes=-10", 100), { start: 90, end: 99, partial: true });
	assert.deepEqual(parseAudioRange("bytes=-200", 100), { start: 0, end: 99, partial: true });
	assert.deepEqual(parseAudioRange("bytes=90-200", 100), { start: 90, end: 99, partial: true });
});

test("malformed, multipart and unsatisfiable ranges are rejected", () => {
	for (const header of ["bytes=", "bytes=-", "bytes=-0", "bytes=100-", "bytes=20-10",
		"bytes=0-1,3-4", "items=0-1", "bytes=9007199254740992-", "bytes=0-nope"]) {
		assert.equal(parseAudioRange(header, 100), null, header);
	}
});

test("audio request checks allow media loads but reject ordinary browser navigation", () => {
	const origin = "https://www.daviddaniliuc.com";
	assert.equal(isAudioPlaybackRequest(new Headers({ "sec-fetch-site": "same-origin", "sec-fetch-dest": "audio" }), origin), true);
	assert.equal(isAudioPlaybackRequest(new Headers({ "sec-fetch-site": "none", "sec-fetch-dest": "document" }), origin), false);
	assert.equal(isAudioPlaybackRequest(new Headers({ "sec-fetch-site": "same-origin", "sec-fetch-dest": "document" }), origin), false);
	assert.equal(isAudioPlaybackRequest(new Headers({ "sec-fetch-site": "cross-site", "sec-fetch-dest": "audio" }), origin), false);
	assert.equal(isAudioPlaybackRequest(new Headers({ "sec-fetch-site": "same-site", "sec-fetch-dest": "audio" }), origin), false);
	assert.equal(isAudioPlaybackRequest(new Headers({ referer: `${origin}/music`, range: "bytes=0-" }), origin), true);
	assert.equal(isAudioPlaybackRequest(new Headers({ referer: `${origin}/music` }), origin), false);
	assert.equal(isAudioPlaybackRequest(new Headers({ referer: "https://example.com/music", range: "bytes=0-" }), origin), false);
	assert.equal(isAudioPlaybackRequest(new Headers(), origin), false);
});

test("sessions require a secret, authenticate signatures and expire", async () => {
	const originalSecret = process.env.AUDIO_SESSION_SECRET;
	const originalMode = process.env.NODE_ENV;
	const originalNow = Date.now;
	try {
		process.env.NODE_ENV = "production";
		delete process.env.AUDIO_SESSION_SECRET;
		assert.equal(await createAudioSession(), null);
		process.env.AUDIO_SESSION_SECRET = "test-only-secret-with-at-least-32-characters";
		const token = await createAudioSession();
		assert.equal(await verifyAudioSession(token), true);
		assert.equal(await verifyAudioSession(undefined), false);
		assert.equal(await verifyAudioSession("invalid"), false);
		const parts = token.split(".");
		parts[0] = String(Number(parts[0]) + 1);
		assert.equal(await verifyAudioSession(parts.join(".")), false);
		process.env.AUDIO_SESSION_SECRET = "different-test-secret-with-at-least-32-characters";
		assert.equal(await verifyAudioSession(token), false);
		process.env.AUDIO_SESSION_SECRET = "test-only-secret-with-at-least-32-characters";
		Date.now = () => originalNow() + 3600 * 1000;
		assert.equal(await verifyAudioSession(token), false);
	} finally {
		Date.now = originalNow;
		if (originalSecret === undefined) delete process.env.AUDIO_SESSION_SECRET;
		else process.env.AUDIO_SESSION_SECRET = originalSecret;
		if (originalMode === undefined) delete process.env.NODE_ENV;
		else process.env.NODE_ENV = originalMode;
	}
});

test("cancelled recovery cannot reload after pause, unmount, or returning to the same track", async () => {
	for (const action of ["pause", "unmount", "switch A to B to A"]) {
		const recovery = new AudioPlaybackRecovery();
		let loads = 0;
		let plays = 0;
		let completeRenewal;
		let renewalSignal;
		const started = new Promise((resolve) => {
			const audio = { currentTime: 90, load: () => loads++, play: async () => {} };
			recovery.retry(audio, (signal) => {
				renewalSignal = signal;
				resolve();
				return new Promise((complete) => { completeRenewal = complete; });
			}, () => plays++, () => assert.fail("Unexpected exhaustion"), 0);
		});
		await started;
		if (action.startsWith("switch")) {
			recovery.reset();
			recovery.reset();
		} else recovery.cancel();
		assert.equal(renewalSignal.aborted, true, action);
		completeRenewal();
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(loads, 0, action);
		assert.equal(plays, 0, action);
	}
});

test("two failed reloads preserve the original position and then stop retrying", async () => {
	const recovery = new AudioPlaybackRecovery();
	let loads = 0;
	let exhausted = false;
	const audio = { currentTime: 90, load() { loads++; this.currentTime = 0; }, play: async () => {} };
	for (let attempt = 0; attempt < 2; attempt++) {
		await new Promise((resolve) => {
			recovery.retry(audio, async () => { throw new Error("Offline"); }, resolve,
				() => assert.fail("Unexpected exhaustion"), 0);
		});
		assert.equal(recovery.resumeTime, 90);
	}
	recovery.retry(audio, async () => {}, () => assert.fail("Unexpected third reload"), () => { exhausted = true; }, 0);
	assert.equal(loads, 2);
	assert.equal(exhausted, true);
	recovery.restoreTime(audio);
	assert.equal(audio.currentTime, 90);
	assert.equal(recovery.resumeTime, undefined);
});

test("old play rejections cannot affect a newer playback request", async () => {
	const recovery = new AudioPlaybackRecovery();
	let rejectOldPlay;
	let rejections = 0;
	const audio = { currentTime: 0, load() {}, play: () => new Promise((_, reject) => { rejectOldPlay = reject; }) };
	recovery.play(audio, () => true, () => rejections++);
	recovery.reset();
	rejectOldPlay(new DOMException("Old request failed", "NotAllowedError"));
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(rejections, 0);
	audio.play = async () => { throw new Error("Current request failed"); };
	recovery.play(audio, () => true, () => rejections++);
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(rejections, 1);
});

test("a hung session renewal times out, and a subsequent renewal can succeed", async () => {
	const originalFetch = globalThis.fetch;
	try {
		globalThis.fetch = async (_, { signal }) => new Promise((_, reject) => {
			signal.addEventListener("abort", () => reject(signal.reason), { once: true });
		});
		await assert.rejects(renewAudioSession(undefined, 10), { name: "TimeoutError" });
		globalThis.fetch = async () => new Response(null, { status: 204 });
		await renewAudioSession(undefined, 10);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("session renewal respects cancellation and rejects server errors", async () => {
	const originalFetch = globalThis.fetch;
	try {
		globalThis.fetch = async (_, { signal }) => {
			signal.throwIfAborted();
			return new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
		};
		const controller = new AbortController();
		const pending = renewAudioSession(controller.signal);
		controller.abort();
		await assert.rejects(pending, { name: "AbortError" });
		await assert.rejects(renewAudioSession(controller.signal), { name: "AbortError" });
		globalThis.fetch = async () => new Response(null, { status: 503 });
		await assert.rejects(renewAudioSession(), /Playback session unavailable/);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("successful playback cancels a queued reload and starts a fresh retry budget", async () => {
	const recovery = new AudioPlaybackRecovery();
	let loads = 0;
	const audio = { currentTime: 90, load() { loads++; this.currentTime = 0; }, play: async () => {} };
	recovery.retry(audio, async () => {}, () => assert.fail("Playback already recovered"), () => assert.fail("Unexpected exhaustion"), 20);
	recovery.succeeded();
	await new Promise((resolve) => setTimeout(resolve, 30));
	assert.equal(loads, 0);
	for (let attempt = 0; attempt < 2; attempt++) {
		await new Promise((resolve) => recovery.retry(audio, async () => {}, resolve,
			() => assert.fail("Successful playback should reset the retry budget"), 0));
	}
	assert.equal(loads, 2);
	recovery.reset();
});

test("a seek during recovery overrides the saved position until metadata returns", async () => {
	const recovery = new AudioPlaybackRecovery();
	const audio = { currentTime: 90, load() { this.currentTime = 0; }, play: async () => {} };
	recovery.rememberTime(audio.currentTime);
	recovery.resumeTime = 120;
	await new Promise((resolve) => recovery.retry(audio, async () => {}, resolve,
		() => assert.fail("Unexpected exhaustion"), 0));
	recovery.restoreTime(audio);
	assert.equal(audio.currentTime, 120);
	recovery.reset();
});
