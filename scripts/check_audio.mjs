import { stat } from "node:fs/promises";

const audioFiles = ["kawartha_echos.mp3", "cant_you_see_v1.mp3"];
let missing = false;

for (const filename of audioFiles) {
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
