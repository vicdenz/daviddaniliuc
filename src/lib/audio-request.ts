// Browser media loads identify their destination. Older browsers may omit Fetch
// Metadata headers, so allow their ranged requests from the music page too.
export function isAudioPlaybackRequest(headers: Headers, origin: string) {
	const site = headers.get("sec-fetch-site");
	if (site && site !== "same-origin") return false;
	const destination = headers.get("sec-fetch-dest");
	if (destination !== null) return destination === "audio";
	const referrer = headers.get("referer");
	if (!referrer || !headers.has("range")) return false;
	try {
		const url = new URL(referrer);
		return url.origin === origin && url.pathname === "/music";
	} catch {
		return false;
	}
}
