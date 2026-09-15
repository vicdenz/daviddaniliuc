import tracks from "../../private/audio/tracks.json";

export type MusicTrack = {
	title: string;
	wip?: boolean;
	source: string;
	durationSeconds: number;
};

export const audioTracks = tracks;

// Only display metadata and playback endpoints are passed to the browser.
export const musicTracks: readonly MusicTrack[] = tracks.map(({ id, title, wip, durationSeconds }) => ({
	title, wip, durationSeconds, source: `/api/audio/${encodeURIComponent(id)}`,
}));
