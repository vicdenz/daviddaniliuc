import { musicTracks } from "@/lib/music";
import MusicPlayer from "./MusicPlayer";

export default function MusicPage() {
	return <MusicPlayer musicTracks={musicTracks} />;
}
