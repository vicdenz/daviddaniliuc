import { NextRequest, NextResponse } from "next/server";
import { audioCookieName, audioCookieOptions, createAudioSession } from "@/lib/audio-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
	const headers = { "Cache-Control": "private, no-store" };
	if (request.headers.get("origin") !== request.nextUrl.origin
		|| request.headers.get("sec-fetch-site") === "cross-site") {
		return new NextResponse(null, { status: 403, headers });
	}
	const token = await createAudioSession();
	if (!token) return new NextResponse(null, { status: 503, headers });
	const response = new NextResponse(null, { status: 204, headers });
	response.cookies.set(audioCookieName, token, audioCookieOptions);
	return response;
}
