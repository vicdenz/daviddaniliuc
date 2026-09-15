import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAudioRange } from "../src/lib/audio-range.ts";
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
