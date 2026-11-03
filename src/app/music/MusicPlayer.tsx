"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import type { MusicTrack } from "@/lib/music";
import { AudioPlaybackRecovery, renewAudioSession } from "@/lib/audio-playback";

import styles from "./music.module.css";

// Some browsers stop buffering on a dropped connection without firing an
// error, so a long wait for data while playing is treated as a failed load.
const stallTimeoutMs = 15_000;

function formatTime(seconds: number, round = false) {
	if (!Number.isFinite(seconds)) return "0:00";
	const wholeSeconds = round ? Math.round(seconds) : Math.floor(seconds);
	const minutes = Math.floor(wholeSeconds / 60);
	return `${minutes}:${(wholeSeconds % 60).toString().padStart(2, "0")}`;
}

function hasMediaSession() {
	return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

function syncPositionState(audio: HTMLAudioElement) {
	if (!hasMediaSession() || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
	try {
		navigator.mediaSession.setPositionState?.({
			duration: audio.duration,
			position: Math.min(audio.currentTime, audio.duration),
			playbackRate: audio.playbackRate,
		});
	} catch {
		// Position state is optional; an invalid or unsupported update is ignored.
	}
}

type PlayerIconName = "previous" | "play" | "pause" | "next";

function PlayerIcon({ name }: { name: PlayerIconName }) {
	const paths = {
		previous: <><path d="M6.5 5v14" /><path d="m17.5 7-6 5 6 5V7Z" fill="currentColor" stroke="none" /></>,
		play: <path d="m8.5 5.8 9.5 6.2-9.5 6.2V5.8Z" fill="currentColor" stroke="none" />,
		pause: <><path d="M9 6v12" /><path d="M15 6v12" /></>,
		next: <><path d="M17.5 5v14" /><path d="m6.5 7 6 5-6 5V7Z" fill="currentColor" stroke="none" /></>,
	}[name];

	return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths}</svg>;
}

export default function MusicPlayer({ musicTracks }: { musicTracks: readonly MusicTrack[] }) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const progressRef = useRef<HTMLInputElement>(null);
	const playbackIntent = useRef(false);
	const stallTimer = useRef<number | undefined>(undefined);
	const mediaActions = useRef<{
		play: () => void; pause: () => void; move: (step: number) => void; seek: (time: number) => void;
	}>({ play() {}, pause() {}, move() {}, seek() {} });
	const [recovery] = useState(() => new AudioPlaybackRecovery());
	const [sessionReady, setSessionReady] = useState(false);
	const [sessionAttempt, setSessionAttempt] = useState(0);
	const [activeTrack, setActiveTrack] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [autoplay, setAutoplay] = useState(true);
	const [playbackError, setPlaybackError] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [scrubTime, setScrubTime] = useState<number | null>(null);
	const [duration, setDuration] = useState(musicTracks[0].durationSeconds);
	const track = musicTracks[activeTrack];

	useEffect(() => {
		const controller = new AbortController();
		let inFlight = false;
		let established = false;
		let failures = 0;
		let retry: number | undefined;
		const refreshSession = async () => {
			// Hidden tabs skip renewal unless music is playing in the background.
			if ((document.visibilityState !== "visible" && !playbackIntent.current) || inFlight) return;
			inFlight = true;
			window.clearTimeout(retry);
			try {
				await renewAudioSession(controller.signal);
				if (!controller.signal.aborted) {
					setSessionReady(true);
					if (!established) setPlaybackError(false);
					established = true;
					failures = 0;
				}
			} catch {
				if (!controller.signal.aborted) {
					failures += 1;
					if (!established && failures >= 3) {
						playbackIntent.current = false;
						setIsPlaying(false);
						setPlaybackError(true);
					}
					retry = window.setTimeout(() => void refreshSession(), Math.min(1000 * 2 ** failures, 30_000));
				}
			} finally {
				inFlight = false;
			}
		};
		void refreshSession();
		const interval = window.setInterval(() => void refreshSession(), 30 * 60 * 1000);
		const onVisible = () => void refreshSession();
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			controller.abort();
			window.clearInterval(interval);
			window.clearTimeout(retry);
			recovery.cancel();
			document.removeEventListener("visibilitychange", onVisible);
		};
	}, [recovery, sessionAttempt]);

	const clearStallWatch = useCallback(() => {
		window.clearTimeout(stallTimer.current);
		stallTimer.current = undefined;
	}, []);
	useEffect(() => clearStallWatch, [clearStallWatch]);

	const handlePlayRejection = useCallback((error: unknown) => {
		if (error instanceof DOMException && error.name === "AbortError") return;
		if (error instanceof DOMException && error.name === "NotAllowedError") {
			playbackIntent.current = false;
			setIsPlaying(false);
			return;
		}
		// Media errors also trigger onError, where a retry can recover playback.
		if (!audioRef.current?.error) {
			playbackIntent.current = false;
			setIsPlaying(false);
			setPlaybackError(true);
		}
	}, []);
	const startPlayback = useCallback((audio: HTMLAudioElement) => {
		playbackIntent.current = true;
		setIsPlaying(true);
		setPlaybackError(false);
		recovery.play(audio, () => playbackIntent.current, handlePlayRejection);
	}, [recovery, handlePlayRejection]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!sessionReady || !audio || audio.getAttribute("src") === track.source) return;
		audio.setAttribute("src", track.source);
		audio.load();
		if (playbackIntent.current) startPlayback(audio);
	}, [sessionReady, track.source, startPlayback]);

	const requestPlayback = (audio: HTMLAudioElement) => {
		if (!sessionReady) {
			// Retry the session immediately; the source effect starts playback once it is ready.
			playbackIntent.current = true;
			setIsPlaying(true);
			setPlaybackError(false);
			setSessionAttempt((attempt) => attempt + 1);
			return;
		}
		recovery.succeeded();
		if (audio.error) {
			recovery.rememberTime(audio.currentTime);
			audio.load();
		}
		startPlayback(audio);
	};
	const pausePlayback = (audio: HTMLAudioElement) => {
		playbackIntent.current = false;
		clearStallWatch();
		recovery.cancel();
		audio.pause();
		setIsPlaying(false);
	};
	const selectTrack = (index: number, shouldPlay?: boolean) => {
		const audio = audioRef.current;
		if (!audio) return;
		const continuePlayback = shouldPlay ?? playbackIntent.current;
		if (index === activeTrack) {
			if (shouldPlay !== false) requestPlayback(audio);
			else pausePlayback(audio);
			return;
		}
		recovery.reset();
		clearStallWatch();
		playbackIntent.current = continuePlayback;
		audio.pause();
		setIsPlaying(false);
		setPlaybackError(false);
		setActiveTrack(index);
		setDuration(musicTracks[index].durationSeconds);
		setCurrentTime(0);
		setScrubTime(null);
		if (sessionReady) {
			audio.setAttribute("src", musicTracks[index].source);
			audio.load();
			if (continuePlayback) startPlayback(audio);
		}
	};

	const moveTrack = (step: number) => {
		const nextTrack = activeTrack + step;
		if (nextTrack < 0 || nextTrack >= musicTracks.length) return;
		selectTrack(nextTrack);
	};
	const handleTrackEnd = () => {
		recovery.cancel();
		clearStallWatch();
		playbackIntent.current = false;
		setIsPlaying(false);
		if (autoplay && activeTrack < musicTracks.length - 1) selectTrack(activeTrack + 1, true);
	};
	const togglePlayback = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (playbackIntent.current) pausePlayback(audio);
		else requestPlayback(audio);
	};

	const displayTime = scrubTime ?? currentTime;
	const progress = duration ? (displayTime / duration) * 100 : 0;
	const progressStyle = { "--track-progress": `${progress}%` } as CSSProperties;
	const syncDuration = (audio: HTMLAudioElement) => {
		if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
		syncPositionState(audio);
	};
	const handlePlaybackError = () => {
		const audio = audioRef.current;
		clearStallWatch();
		if (!audio || !sessionReady) return;
		recovery.retry(audio, renewAudioSession, () => {
			if (playbackIntent.current) startPlayback(audio);
		}, () => {
			playbackIntent.current = false;
			setIsPlaying(false);
			setPlaybackError(true);
		});
	};
	const watchForStall = () => {
		const audio = audioRef.current;
		if (!audio || !playbackIntent.current || stallTimer.current !== undefined) return;
		stallTimer.current = window.setTimeout(() => {
			stallTimer.current = undefined;
			if (playbackIntent.current && !audio.paused && audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
				handlePlaybackError();
			}
		}, stallTimeoutMs);
	};
	const seek = useCallback((nextTime: number) => {
		const audio = audioRef.current;
		setScrubTime(null);
		if (!audio || !Number.isFinite(nextTime)) return;
		const clampedTime = Math.min(Math.max(nextTime, 0), duration);
		if (recovery.resumeTime !== undefined) recovery.resumeTime = clampedTime;
		else audio.currentTime = clampedTime;
		setCurrentTime(clampedTime);
	}, [duration, recovery]);

	// React's onChange fires for every input event, so dragging only previews the
	// position. The native change event fires on release (and on each keyboard
	// step), which is when the audio actually seeks.
	useEffect(() => {
		const input = progressRef.current;
		if (!input) return;
		const commit = () => seek(input.valueAsNumber);
		input.addEventListener("change", commit);
		return () => input.removeEventListener("change", commit);
	}, [seek]);

	useEffect(() => {
		mediaActions.current = {
			play: () => {
				const audio = audioRef.current;
				if (audio && !playbackIntent.current) requestPlayback(audio);
			},
			pause: () => {
				const audio = audioRef.current;
				if (audio && playbackIntent.current) pausePlayback(audio);
			},
			move: moveTrack,
			seek,
		};
	});
	useEffect(() => {
		if (!hasMediaSession()) return;
		const session = navigator.mediaSession;
		const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
			["play", () => mediaActions.current.play()],
			["pause", () => mediaActions.current.pause()],
			["previoustrack", () => mediaActions.current.move(-1)],
			["nexttrack", () => mediaActions.current.move(1)],
			["seekto", (details) => {
				if (details.seekTime !== undefined) mediaActions.current.seek(details.seekTime);
			}],
		];
		for (const [action, handler] of handlers) {
			try {
				session.setActionHandler(action, handler);
			} catch {
				// The browser does not support this action.
			}
		}
		return () => {
			for (const [action] of handlers) {
				try {
					session.setActionHandler(action, null);
				} catch {
					// The browser does not support this action.
				}
			}
			session.metadata = null;
			session.playbackState = "none";
		};
	}, []);
	useEffect(() => {
		if (hasMediaSession()) navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: "David Daniliuc" });
	}, [track.title]);
	useEffect(() => {
		if (hasMediaSession()) navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
	}, [isPlaying]);

	return (
		<main className={`site-page ${styles.music}`}>
			<header className={`${styles.header} reveal reveal-from-bottom reveal-offset-24 reveal-0`}>
				<h1 className="site-page-title">My music;</h1>
				<Link href="/">Back home</Link>
			</header>

			<section className={`${styles.player} reveal reveal-from-right reveal-offset-24 reveal-100`} aria-label="Music player">
				<audio
					ref={audioRef}
					preload="metadata"
					onLoadedMetadata={(event) => {
						syncDuration(event.currentTarget);
						recovery.restoreTime(event.currentTarget);
					}}
					onDurationChange={(event) => syncDuration(event.currentTarget)}
					onTimeUpdate={(event) => setCurrentTime(recovery.resumeTime ?? event.currentTarget.currentTime)}
					onSeeked={(event) => {
						setCurrentTime(recovery.resumeTime ?? event.currentTarget.currentTime);
						syncPositionState(event.currentTarget);
					}}
					onWaiting={watchForStall}
					onStalled={watchForStall}
					onPlaying={(event) => {
						clearStallWatch();
						playbackIntent.current = true;
						recovery.succeeded();
						setIsPlaying(true);
						setPlaybackError(false);
						syncPositionState(event.currentTarget);
					}}
					onPause={(event) => {
						// Ignore pause events queued by an older source or a failed load.
						if (!event.currentTarget.paused || event.currentTarget.error) return;
						clearStallWatch();
						playbackIntent.current = false;
						recovery.cancel();
						setIsPlaying(false);
						syncPositionState(event.currentTarget);
					}}
					onEnded={handleTrackEnd}
					onError={handlePlaybackError}
				/>

				<div className={styles.readout}>
					<div>
						<p className={styles.readoutLabel}>now playing</p>
						<p className={styles.readoutTitle} aria-live="polite">{track.title}</p>
					</div>
					<p className={styles.time}>{formatTime(displayTime)} / {formatTime(duration, true)}</p>
				</div>

				<div className={styles.transport}>
					<button type="button" onClick={() => moveTrack(-1)} aria-label="Previous track"><PlayerIcon name="previous" /></button>
					<button className={styles.playButton} type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}><PlayerIcon name={isPlaying ? "pause" : "play"} /></button>
					<button type="button" onClick={() => moveTrack(1)} aria-label="Next track"><PlayerIcon name="next" /></button>
				</div>

				<label className={styles.progress}>
					<span className={styles.srOnly}>Track position</span>
					<input
						ref={progressRef}
						type="range"
						min="0"
						max={duration}
						step="0.01"
						disabled={!sessionReady}
						value={Math.min(displayTime, duration)}
						style={progressStyle}
						onChange={(event) => setScrubTime(event.currentTarget.valueAsNumber)}
						// An interrupted drag never fires change; drop the preview so the clock resumes.
						onPointerCancel={() => setScrubTime(null)}
					/>
				</label>
				<div className={styles.playbackStatus}>
					<button className={styles.autoplayToggle} type="button" onClick={() => setAutoplay((enabled) => !enabled)} aria-pressed={autoplay}>
						<span className={styles.autoplayState} aria-hidden="true">{autoplay ? "✓" : "×"}</span>
						<span>autoplay</span>
					</button>
					{playbackError && <span className={styles.playbackError} role="alert">an error occurred</span>}
				</div>
			</section>

			<section className="reveal reveal-from-left reveal-offset-24 reveal-200" aria-labelledby="track-list-title">
				<div className={styles.archiveHeading}>
					<h2 id="track-list-title">Tracks</h2>
					<span>{musicTracks.length.toString().padStart(2, "0")} songs</span>
				</div>
				<ol className={styles.trackList}>
					{musicTracks.map((track, index) => (
						<li className={index === activeTrack ? styles.activeTrack : undefined} key={track.source}>
							<span className={styles.trackNumber}>{(index + 1).toString().padStart(2, "0")}</span>
							<button type="button" onClick={() => selectTrack(index)} aria-label={index === activeTrack ? `Play ${track.title}` : `Select ${track.title}`}>
								<span className={styles.trackTitle}>{track.title}{track.wip && <span className={styles.trackWip}>[WIP]</span>}</span>
							</button>
						</li>
					))}
				</ol>
			</section>
		</main>
	);
}
