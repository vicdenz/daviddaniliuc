"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type CSSProperties } from "react";

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
	const playWhenReady = useRef(false);
	const [activeTrack, setActiveTrack] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [autoplay, setAutoplay] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(musicTracks[0].durationSeconds);

	const playTrack = useCallback((index: number, playOnLoad = false) => {
		const audio = audioRef.current;
		if (!audio) return;
		if (index !== activeTrack) {
			playWhenReady.current = playOnLoad;
			audio.pause();
			setActiveTrack(index);
			setDuration(musicTracks[index].durationSeconds);
			setCurrentTime(0);
			return;
		}
		void audio.play().catch(() => setIsPlaying(false));
	}, [activeTrack]);

	const moveTrack = useCallback((step: number) => {
		const nextTrack = activeTrack + step;
		if (nextTrack < 0 || nextTrack >= musicTracks.length) return;
		playTrack(nextTrack);
	}, [activeTrack, playTrack]);
	const handleTrackEnd = useCallback(() => {
		if (autoplay && activeTrack < musicTracks.length - 1) playTrack(activeTrack + 1, true);
	}, [activeTrack, autoplay, playTrack]);

	const togglePlayback = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (audio.paused) void audio.play().catch(() => setIsPlaying(false));
		else audio.pause();
	};

	const progress = duration ? (currentTime / duration) * 100 : 0;
	const progressStyle = { "--track-progress": `${progress}%` } as CSSProperties;
	const syncDuration = (audio: HTMLAudioElement) => {
		if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
	};
	const playLoadedTrack = (audio: HTMLAudioElement) => {
		if (!playWhenReady.current) return;
		playWhenReady.current = false;
		void audio.play().catch(() => setIsPlaying(false));
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
					src={musicTracks[activeTrack].source}
					preload="metadata"
					onLoadedMetadata={(event) => {
						syncDuration(event.currentTarget);
						playLoadedTrack(event.currentTarget);
					}}
					onCanPlay={(event) => playLoadedTrack(event.currentTarget)}
					onDurationChange={(event) => syncDuration(event.currentTarget)}
					onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
					onSeeked={(event) => setCurrentTime(event.currentTarget.currentTime)}
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					onEnded={handleTrackEnd}
				/>

				<div className={styles.readout} aria-live="polite">
					<div>
						<p className={styles.readoutLabel}>now playing</p>
						<p className={styles.readoutTitle}>{musicTracks[activeTrack].title}</p>
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
				<button className={styles.autoplayToggle} type="button" onClick={() => setAutoplay((enabled) => !enabled)} aria-pressed={autoplay}>
					<span className={styles.autoplayState} aria-hidden="true">{autoplay ? "✓" : "×"}</span>
					<span>autoplay</span>
				</button>
			</section>

			<section className={`${styles.archive} reveal reveal-from-left reveal-offset-24 reveal-200`} aria-labelledby="track-list-title">
				<div className={styles.archiveHeading}>
					<h2 id="track-list-title">Tracks</h2>
					<span>{musicTracks.length.toString().padStart(2, "0")} songs</span>
				</div>
				<ol className={styles.trackList}>
					{musicTracks.map((track, index) => (
						<li className={index === activeTrack ? styles.activeTrack : undefined} key={track.title}>
							<span className={styles.trackNumber}>{(index + 1).toString().padStart(2, "0")}</span>
							<button type="button" onClick={() => playTrack(index)} aria-label={index === activeTrack ? `Play ${track.title}` : `Select ${track.title}`}>
								<span className={styles.trackTitle}>{track.title}{track.wip && <span className={styles.trackWip}>[WIP]</span>}</span>
							</button>
						</li>
					))}
				</ol>
			</section>
		</main>
	);
}
