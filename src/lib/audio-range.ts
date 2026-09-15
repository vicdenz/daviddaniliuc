// A single byte range covers browser playback and seeking. Multipart ranges
// are deliberately rejected rather than buffering or assembling whole files.
export function parseAudioRange(header: string | null, size: number) {
	if (header === null) return { start: 0, end: size - 1, partial: false };
	const match = /^bytes=(\d*)-(\d*)$/.exec(header);
	if (!match || (!match[1] && !match[2])) return null;
	if (!match[1]) {
		const suffix = Number(match[2]);
		if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
		return { start: Math.max(0, size - suffix), end: size - 1, partial: true };
	}
	const start = Number(match[1]);
	const requestedEnd = match[2] ? Number(match[2]) : size - 1;
	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd)
		|| start >= size || requestedEnd < start) return null;
	return { start, end: Math.min(requestedEnd, size - 1), partial: true };
}
