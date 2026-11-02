import assert from "node:assert/strict";
import { test } from "node:test";
import { BackdropCadence } from "../src/components/backdrop/cadence.ts";

function run(cadence, hz, seconds, { start = 0, scrolling = false } = {}) {
	let frames = 0;
	for (let i = 0; i < hz * seconds; i++) {
		if (cadence.step(start + i * 1000 / hz, scrolling)) frames++;
	}
	return frames;
}

test("capable displays maintain 60fps without fallback", () => {
	for (const hz of [60, 90, 120, 144]) {
		const cadence = new BackdropCadence();
		const frames = run(cadence, hz, 30);
		assert.ok(Math.abs(frames - 1800) <= 1, `${hz}Hz: ${frames} frames`);
		assert.equal(cadence.targetFps, 60);
	}
});

test("sustained poor delivery falls back gradually, after scrolling pauses", () => {
	const cadence = new BackdropCadence();
	run(cadence, 30, 14, { scrolling: true });
	assert.equal(cadence.targetFps, 30);
	assert.equal(cadence.frameTime, 1000 / 60);
	run(cadence, 60, 1, { start: 14000 });
	assert.ok(cadence.frameTime > 1000 / 60 && cadence.frameTime < 1000 / 30);
	run(cadence, 60, 2, { start: 15000 });
	assert.equal(cadence.frameTime, 1000 / 30);
	const frames = run(cadence, 144, 10, { start: 17000 });
	assert.ok(Math.abs(frames - 300) <= 1);
	assert.equal(cadence.targetFps, 30, "does not oscillate back to 60");
});

test("a temporary slowdown or isolated long task does not trigger fallback", () => {
	const cadence = new BackdropCadence();
	run(cadence, 60, 4);
	run(cadence, 30, 4, { start: 4000 });
	run(cadence, 60, 12, { start: 8000 });
	cadence.step(24000, false);
	run(cadence, 60, 12, { start: 24020 });
	assert.equal(cadence.targetFps, 60);
});

test("hidden time is excluded and resume preserves the selected rate", () => {
	const cadence = new BackdropCadence();
	run(cadence, 60, 10);
	cadence.pause();
	assert.equal(cadence.step(900000, false), true);
	run(cadence, 60, 10, { start: 900017 });
	assert.equal(cadence.targetFps, 60);
	run(cadence, 30, 16, { start: 910017 });
	assert.equal(cadence.frameTime, 1000 / 30);
	cadence.pause();
	cadence.step(1800000, false);
	assert.equal(cadence.frameTime, 1000 / 30);
});

test("severe overload is not mistaken for isolated long tasks", () => {
	const cadence = new BackdropCadence();
	run(cadence, 3, 24);
	assert.equal(cadence.targetFps, 30);
	assert.equal(cadence.frameTime, 1000 / 30);
});

test("settled 30fps pacing stays even without catch-up bursts", () => {
	for (const hz of [60, 90, 120, 144]) {
		const cadence = new BackdropCadence();
		run(cadence, 30, 16);
		run(cadence, hz, 1, { start: 16000 });
		let previous = null;
		for (let i = 0; i < hz * 10; i++) {
			const time = 17000 + i * 1000 / hz;
			if (!cadence.step(time, false)) continue;
			if (previous !== null) {
				const gap = time - previous;
				// Fractional refresh ratios (e.g. 144/30) necessarily alternate
				// adjacent refresh counts; never insert a burst or an extra pause.
				assert.ok(gap >= Math.floor(hz / 30) * 1000 / hz - 0.02, `${hz}Hz gap ${gap}`);
				assert.ok(gap <= Math.ceil(hz / 30) * 1000 / hz + 0.02, `${hz}Hz gap ${gap}`);
			}
			previous = time;
		}
	}
});
