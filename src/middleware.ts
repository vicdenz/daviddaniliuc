import { NextResponse } from "next/server";
import { audioCookieName, audioCookieOptions, createAudioSession } from "@/lib/audio-session";

export async function middleware() {
	const response = NextResponse.next();
	// Include route prefetches so client-side navigation can also play audio.
	const token = await createAudioSession();
	if (token) response.cookies.set(audioCookieName, token, audioCookieOptions);
	return response;
}

export const config = { matcher: ["/music"] };
