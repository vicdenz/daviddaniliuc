// Browser media loads identify their destination. Older browsers may omit Fetch
// Metadata headers, so allow their ranged requests with a same-origin referrer.
// This blocks ordinary navigation; external clients can replay these headers.
export function isAudioPlaybackRequest(headers: Headers, origin: string) {
	const site = headers.get("sec-fetch-site");
	if (site && site !== "same-origin") return false;
	if (headers.get("sec-fetch-mode") === "navigate") return false;
	const destination = headers.get("sec-fetch-dest");
	if (destination !== null) return destination === "audio";
	const referrer = headers.get("referer");
	if (!referrer || !headers.has("range")) return false;
	try {
		const url = new URL(referrer);
		// An origin-only referrer is valid when privacy settings trim the path.
		return url.origin === origin;
	} catch {
		return false;
	}
}
