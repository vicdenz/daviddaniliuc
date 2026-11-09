import { initialTrackIndex, musicTracks } from "@/lib/music";
import MusicPlayer from "./MusicPlayer";

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ track?: string | string[] }> }) {
	const { track } = await searchParams;
	return <MusicPlayer musicTracks={musicTracks} initialTrack={initialTrackIndex(track)} />;
}
