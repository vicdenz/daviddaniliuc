import { readFile, stat } from "node:fs/promises";

const tracks = JSON.parse(await readFile(new URL("../private/audio/tracks.json", import.meta.url), "utf8"));
if (!Array.isArray(tracks) || tracks.length === 0) throw new Error("Track manifest must contain at least one track.");
const ids = new Set();
for (const track of tracks) {
	if (!track || typeof track.id !== "string" || !/^[a-z0-9_-]+$/.test(track.id)
		|| track.id === "session" || ids.has(track.id) || typeof track.title !== "string" || !track.title.trim()
		|| typeof track.filename !== "string" || !/^[a-zA-Z0-9_-]+\.mp3$/.test(track.filename)
		|| !Number.isFinite(track.durationSeconds) || track.durationSeconds <= 0
		|| (track.wip !== undefined && typeof track.wip !== "boolean")) {
		throw new Error("Invalid track manifest: use unique IDs (excluding session), safe MP3 filenames, titles and positive durations.");
	}
	ids.add(track.id);
}
let missing = false;

for (const { filename } of tracks) {
	const file = new URL(`../private/audio/${filename}`, import.meta.url);
	try {
		const info = await stat(file);
		if (!info.isFile() || info.size === 0) throw new Error("Empty or invalid file");
	} catch {
		console.error(`Missing or empty local audio: private/audio/${filename}`);
		missing = true;
	}
}

if (missing) {
	console.error("Restore the MP3s from your local backup before building or deploying. Git clones do not include them.");
	process.exitCode = 1;
} else {
	console.log("Local audio files are ready for deployment.");
}
