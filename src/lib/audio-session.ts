export const audioCookieName = "audio_session";
export const audioSessionLifetime = 60 * 60;

function sessionSecret() {
	const secret = process.env.AUDIO_SESSION_SECRET;
	if (secret && secret.length >= 32) return secret;
	if (process.env.NODE_ENV === "development") return "local-development-audio-session-secret";
	return null;
}

async function signingKey() {
	const secret = sessionSecret();
	if (!secret) return null;
	return crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createAudioSession() {
	const key = await signingKey();
	if (!key) return null;
	const expires = Math.floor(Date.now() / 1000) + audioSessionLifetime;
	const payload = `${expires}.${crypto.randomUUID()}`;
	const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
	const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${payload}.${hex}`;
}

export async function verifyAudioSession(token: string | undefined) {
	if (!token) return false;
	const match = /^(\d+)\.([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(token);
	if (!match) return false;
	const expires = Number(match[1]);
	const now = Math.floor(Date.now() / 1000);
	if (expires <= now || expires > now + audioSessionLifetime) return false;
	const key = await signingKey();
	if (!key) return false;
	const signature = Uint8Array.from(match[3].match(/../g)!, (byte) => parseInt(byte, 16));
	return crypto.subtle.verify("HMAC", key, signature,
		new TextEncoder().encode(`${match[1]}.${match[2]}`));
}

export const audioCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	path: "/api/audio",
	maxAge: audioSessionLifetime,
};
