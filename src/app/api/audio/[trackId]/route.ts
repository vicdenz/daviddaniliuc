import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { parseAudioRange } from "@/lib/audio-range";
import { audioCookieName, audioCookieOptions, createAudioSession, verifyAudioSession } from "@/lib/audio-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const files: Record<string, string> = {
	kawartha_echoes: "kawartha_echos.mp3",
	cant_you_see_v1: "cant_you_see_v1.mp3",
};
const cacheHeaders = { "Cache-Control": "private, no-store", "Vary": "Cookie" };

async function serveAudio(request: NextRequest, context: { params: Promise<{ trackId: string }> }) {
	if (request.headers.get("sec-fetch-site") === "cross-site"
		|| !await verifyAudioSession(request.cookies.get(audioCookieName)?.value)) {
		return new NextResponse(null, { status: 403, headers: cacheHeaders });
	}
	const { trackId } = await context.params;
	if (!Object.hasOwn(files, trackId)) {
		return new NextResponse(null, { status: 404, headers: cacheHeaders });
	}
	const filePath = path.join(process.cwd(), "private", "audio", files[trackId]);
	let size: number;
	try {
		size = (await stat(filePath)).size;
	} catch (error) {
		console.error("Audio file unavailable", trackId, error);
		return new NextResponse(null, { status: 503, headers: cacheHeaders });
	}
	const range = parseAudioRange(request.headers.get("range"), size);
	if (!range) {
		return new NextResponse(null, { status: 416, headers: {
			...cacheHeaders, "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes",
		} });
	}
	const headers = {
		...cacheHeaders,
		"Content-Type": "audio/mpeg",
		"Content-Length": String(range.end - range.start + 1),
		"Accept-Ranges": "bytes",
		"Content-Disposition": "inline",
		"X-Content-Type-Options": "nosniff",
		...(range.partial ? { "Content-Range": `bytes ${range.start}-${range.end}/${size}` } : {}),
	};
	const body = request.method === "HEAD" ? null : Readable.toWeb(createReadStream(filePath, {
		start: range.start, end: range.end, signal: request.signal,
	})) as ReadableStream<Uint8Array>;
	const response = new NextResponse(body, { status: range.partial ? 206 : 200, headers });
	const token = await createAudioSession();
	if (token) response.cookies.set(audioCookieName, token, audioCookieOptions);
	return response;
}

export const GET = serveAudio;
export const HEAD = serveAudio;
