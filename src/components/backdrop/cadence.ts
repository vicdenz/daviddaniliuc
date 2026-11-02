const FAST_INTERVAL = 1000 / 60;
const SLOW_INTERVAL = 1000 / 30;
const WARMUP_MS = 3000;
const SAMPLE_MS = 4000;
const TRANSITION_MS = 2000;

/** Measures visible RAF delivery while the real shader is running, not hardware hints.
 * A one-way fallback avoids quality oscillation. Resolution never changes.
 */
export class BackdropCadence {
	frameTime = FAST_INTERVAL;
	targetFps: 30 | 60 = 60;
	private previousTime: number | null = null;
	private elapsed = 0;
	private warmup = 0;
	private sampleTime = 0;
	private samples = 0;
	private slowSamples = 0;
	private badWindows = 0;
	private transitioning = false;

	/** Hidden-tab time and startup frames must not count as poor performance. */
	pause() {
		this.previousTime = null;
		this.elapsed = 0;
		this.warmup = 0;
		this.resetSamples();
		this.badWindows = 0;
	}

	private resetSamples() {
		this.sampleTime = this.samples = this.slowSamples = 0;
	}

	step(timestamp: number, scrolling: boolean): boolean {
		if (this.previousTime === null) {
			this.previousTime = timestamp;
			return true;
		}
		const delta = Math.max(0, timestamp - this.previousTime);
		this.previousTime = timestamp;
		// Ignore isolated long tasks (compilation, tab suspension, etc.).
		if (delta > 250) {
			this.resetSamples();
			this.elapsed = 0;
			return true;
		}
		this.warmup += delta;
		if (this.targetFps === 60 && this.warmup >= WARMUP_MS) {
			this.sampleTime += delta;
			this.samples++;
			if (delta > 25) this.slowSamples++;
			if (this.sampleTime >= SAMPLE_MS) {
				// Two consecutive windows with >20% late callbacks: brief scroll,
				// resize or loading spikes cannot by themselves trigger a fallback.
				this.badWindows = this.slowSamples / this.samples > 0.2 ? this.badWindows + 1 : 0;
				this.resetSamples();
				if (this.badWindows >= 2) this.targetFps = 30;
			}
		}
		if (this.targetFps === 30 && !scrolling) this.transitioning = true;
		if (this.transitioning) {
			this.frameTime = Math.min(SLOW_INTERVAL, this.frameTime + (SLOW_INTERVAL - FAST_INTERVAL) * delta / TRANSITION_MS);
		}
		// Carry the remainder across frames and rate changes; never reset the
		// animation clock or introduce an extra render loop.
		this.elapsed += delta;
		if (this.elapsed + 0.01 < this.frameTime) return false;
		this.elapsed = Math.max(0, this.elapsed - this.frameTime) % this.frameTime;
		return true;
	}
}
