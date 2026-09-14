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
		source: "/audio/kawartha_echos.mp3",
		durationSeconds: 203,
	},
	{
		title: "cant_you_see_v1",
		wip: true,
		source: "/audio/cant_you_see_v1.mp3",
		durationSeconds: 89,
	},
] satisfies readonly MusicTrack[];
