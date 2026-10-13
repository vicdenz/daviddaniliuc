export async function renewAudioSession(signal?: AbortSignal, timeoutMs = 8000) {
	const controller = new AbortController();
	const abort = () => controller.abort(signal?.reason);
	if (signal?.aborted) abort();
	else signal?.addEventListener("abort", abort, { once: true });
	const timeout = setTimeout(() => controller.abort(new DOMException("Playback session timed out", "TimeoutError")), timeoutMs);
	try {
		const response = await fetch("/api/audio/session", {
			method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
		});
		if (!response.ok) throw new Error("Playback session unavailable");
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener("abort", abort);
	}
}

type PlaybackAudio = Pick<HTMLAudioElement, "currentTime" | "load" | "play">;

// Each user action invalidates older retries and play promises, even if the
// listener switches away from a track and then returns to the same URL.
export class AudioPlaybackRecovery {
	private generation = 0;
	private controller?: AbortController;
	private timer?: ReturnType<typeof setTimeout>;
	private attempts = 0;
	resumeTime?: number;

	cancel() {
		this.generation += 1;
		this.controller?.abort();
		this.controller = undefined;
		clearTimeout(this.timer);
		this.timer = undefined;
	}

	reset() {
		this.cancel();
		this.attempts = 0;
		this.resumeTime = undefined;
	}

	succeeded() {
		this.cancel();
		this.attempts = 0;
	}

	rememberTime(time: number) {
		if (this.resumeTime === undefined && Number.isFinite(time) && time > 0) this.resumeTime = time;
	}

	restoreTime(audio: PlaybackAudio) {
		if (this.resumeTime === undefined) return;
		audio.currentTime = this.resumeTime;
		this.resumeTime = undefined;
	}

	play(audio: PlaybackAudio, wantsPlayback: () => boolean, onRejection: (error: unknown) => void) {
		const generation = this.generation;
		void audio.play().catch((error: unknown) => {
			if (generation === this.generation && wantsPlayback()) onRejection(error);
		});
	}

	retry(audio: PlaybackAudio, renew: (signal: AbortSignal) => Promise<void>,
		onReload: () => void, onExhausted: () => void, delayMs?: number) {
		this.cancel();
		this.rememberTime(audio.currentTime);
		if (this.attempts >= 2) {
			onExhausted();
			return;
		}
		this.attempts += 1;
		const generation = this.generation;
		const controller = new AbortController();
		this.controller = controller;
		this.timer = setTimeout(() => {
			this.timer = undefined;
			void (async () => {
				try { await renew(controller.signal); } catch { /* The existing session may still work. */ }
				if (controller.signal.aborted || generation !== this.generation) return;
				this.controller = undefined;
				audio.load();
				onReload();
			})();
		}, delayMs ?? this.attempts * 1000);
	}
}
