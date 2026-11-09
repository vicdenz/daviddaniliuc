import tracks from "../../private/audio/tracks.json";

export type MusicTrack = {
	title: string;
	demo?: boolean;
	source: string;
	durationSeconds: number;
};

export const audioTracks = tracks;

// Only display metadata and playback endpoints are passed to the browser.
export const musicTracks: readonly MusicTrack[] = tracks.map(({ id, title, demo, durationSeconds }) => ({
	title, demo, durationSeconds, source: `/api/audio/${encodeURIComponent(id)}`,
}));

// A missing, unknown or repeated ?track= value falls back to the first track.
export function initialTrackIndex(trackId: string | string[] | undefined) {
	return Math.max(tracks.findIndex(({ id }) => id === trackId), 0);
}
