"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";

import { musicTracks } from "@/content/music";

import styles from "./music.module.css";

function formatTime(seconds: number, round = false) {
	if (!Number.isFinite(seconds)) return "0:00";
	const wholeSeconds = round ? Math.round(seconds) : Math.floor(seconds);
	const minutes = Math.floor(wholeSeconds / 60);
	return `${minutes}:${(wholeSeconds % 60).toString().padStart(2, "0")}`;
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

export default function MusicPage() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const pendingPlayback = useRef(false);
	const [activeTrack, setActiveTrack] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [autoplay, setAutoplay] = useState(true);
	const [playbackError, setPlaybackError] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(musicTracks[0].durationSeconds);
	const track = musicTracks[activeTrack];

	const requestPlayback = (audio: HTMLAudioElement) => {
		setPlaybackError(false);
		void audio.play().catch((error: unknown) => {
			if (error instanceof DOMException && error.name === "AbortError") return;
			setIsPlaying(false);
			setPlaybackError(true);
		});
	};
	const selectTrack = (index: number, shouldPlay?: boolean) => {
		const audio = audioRef.current;
		if (!audio) return;
		const cancelPendingPlayback = pendingPlayback.current && shouldPlay === undefined;
		// Normal track changes preserve whether the current track is playing.
		const continuePlayback = shouldPlay ?? !audio.paused;

		if (index !== activeTrack) {
			pendingPlayback.current = cancelPendingPlayback ? false : continuePlayback;
			audio.pause();
			if (!pendingPlayback.current) setIsPlaying(false);
			setPlaybackError(false);
			setActiveTrack(index);
			setDuration(musicTracks[index].durationSeconds);
			setCurrentTime(0);
			return;
		}
		if (cancelPendingPlayback) {
			pendingPlayback.current = false;
			audio.pause();
			setIsPlaying(false);
			return;
		}
		requestPlayback(audio);
	};

	const moveTrack = (step: number) => {
		const nextTrack = activeTrack + step;
		if (nextTrack < 0 || nextTrack >= musicTracks.length) return;
		selectTrack(nextTrack);
	};
	const handleTrackEnd = () => {
		if (autoplay && activeTrack < musicTracks.length - 1) selectTrack(activeTrack + 1, true);
	};

	const togglePlayback = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (pendingPlayback.current) {
			pendingPlayback.current = false;
			setIsPlaying(false);
			return;
		}
		if (audio.paused) requestPlayback(audio);
		else audio.pause();
	};

	const progress = duration ? (currentTime / duration) * 100 : 0;
	const progressStyle = { "--track-progress": `${progress}%` } as CSSProperties;
	const syncDuration = (audio: HTMLAudioElement) => {
		if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
	};
	const playPendingTrack = (audio: HTMLAudioElement) => {
		if (!pendingPlayback.current) return;
		pendingPlayback.current = false;
		requestPlayback(audio);
	};
	const handlePlaybackError = () => {
		pendingPlayback.current = false;
		setIsPlaying(false);
		setPlaybackError(true);
	};
	const seek = (nextTime: number) => {
		const audio = audioRef.current;
		if (!audio || !Number.isFinite(nextTime)) return;
		const clampedTime = Math.min(Math.max(nextTime, 0), duration);
		audio.currentTime = clampedTime;
		setCurrentTime(clampedTime);
	};

	return (
		<main className={styles.music}>
			<header className={`${styles.header} reveal reveal-from-bottom reveal-offset-24 reveal-0`}>
				<h1>My music;</h1>
				<Link href="/">Back home</Link>
			</header>

			<section className={`${styles.player} reveal reveal-from-right reveal-offset-24 reveal-100`} aria-label="Music player">
				<audio
					ref={audioRef}
					src={track.source}
					preload="metadata"
					onLoadedMetadata={(event) => {
						syncDuration(event.currentTarget);
						playPendingTrack(event.currentTarget);
					}}
					onCanPlay={(event) => playPendingTrack(event.currentTarget)}
					onDurationChange={(event) => syncDuration(event.currentTarget)}
					onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
					onSeeked={(event) => setCurrentTime(event.currentTarget.currentTime)}
					onPlay={() => {
						setIsPlaying(true);
						setPlaybackError(false);
					}}
					onPause={() => {
						if (!pendingPlayback.current) setIsPlaying(false);
					}}
					onEnded={handleTrackEnd}
					onError={handlePlaybackError}
				/>

				<div className={styles.readout} aria-live="polite">
					<div>
						<p className={styles.readoutLabel}>now playing</p>
						<p className={styles.readoutTitle}>{track.title}</p>
					</div>
					<p className={styles.time}>{formatTime(currentTime)} / {formatTime(duration, true)}</p>
				</div>

				<div className={styles.transport}>
					<button type="button" onClick={() => moveTrack(-1)} aria-label="Previous track"><PlayerIcon name="previous" /></button>
					<button className={styles.playButton} type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}><PlayerIcon name={isPlaying ? "pause" : "play"} /></button>
					<button type="button" onClick={() => moveTrack(1)} aria-label="Next track"><PlayerIcon name="next" /></button>
				</div>

				<label className={styles.progress}>
					<span className={styles.srOnly}>Track position</span>
					<input
						type="range"
						min="0"
						max={duration}
						step="0.01"
						value={Math.min(currentTime, duration)}
						style={progressStyle}
						onInput={(event) => seek(event.currentTarget.valueAsNumber)}
						onChange={(event) => seek(event.currentTarget.valueAsNumber)}
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
						<li className={index === activeTrack ? styles.activeTrack : undefined} key={track.title}>
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
