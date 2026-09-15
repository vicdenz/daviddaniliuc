export type MusicTrack = {
	title: string;
	wip?: boolean;
	source: string;
	durationSeconds: number;
};

export const musicTracks = [
	{
		title: "kawartha_echoes",
		wip: true,
		source: "/api/audio/kawartha_echoes",
		durationSeconds: 203,
	},
	{
		title: "cant_you_see_v1",
		wip: true,
		source: "/api/audio/cant_you_see_v1",
		durationSeconds: 89,
	},
] satisfies readonly MusicTrack[];
