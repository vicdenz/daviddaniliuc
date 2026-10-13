# Audio playback validation

Local checks performed on 2026-10-13 for the `codex/private-music-playback` branch. No layout, styling, text, or visible control markup changed.

## Passed

- 11 range, session, timeout, cancellation, and playback-recovery unit tests.
- 8 HTTP integration tests against the actual audio route code with both local MP3s.
- Bare URLs, ordinary browser navigation, and HEAD navigation return 403, including with a valid player session.
- Invalid sessions and cross-origin requests return 403.
- Modern media requests and legacy ranged requests with full or origin-only same-origin referrers return 206.
- Startup ranges, two-byte probes, seeking, suffix ranges, and media HEAD requests return the expected lengths and bytes.
- Cancelling an open-ended stream allows the next track to load normally.
- Returned startup chunks decode successfully with FFmpeg; they match the source files byte for byte.
- Lint, focused TypeScript validation, and audio manifest validation pass.

The privacy compatibility fix accepts origin-only referrers for legacy ranged media loads. Navigation requests remain denied. The request checks discourage opening or downloading a bare URL; scripted clients can replay authorized media requests.

## Transport measurements

Single local samples using curl rate limiting, with no simulated network latency or production cold start. These are transport measurements, not browser click-to-play measurements. Curl can burst at the start of a short transfer.

| Track | First 64 KiB at 200 KiB/s | First 128 KiB at 50 KiB/s |
| --- | --- | --- |
| kawartha_echoes | 0.164 s | 2.003 s |
| cant_you_see_v1 | 0.167 s | 2.022 s |

The first 64 KiB of each response contained decodable audio. Leading metadata is 0 bytes for kawartha_echoes and 45 bytes for cant_you_see_v1, so there is no large metadata block before the first audio frames. The original MP3s remain unchanged.

## Coverage limits

The test environment could not resolve npm or GitHub, connect an in-app browser, or launch Chromium/Safari automation. A standalone production harness copied the unchanged music page, CSS, library files, API routes, and local tracks. It built successfully using the available Next.js 16.3.5 / React 19.3 tooling. It excluded the site's shared loader/backdrop and used different dependency versions from the project. This does not constitute a full-site production build.

Real iPhone/iPad Safari, Android Chrome, desktop Chrome/Firefox/Safari, mobile click-to-play latency, background/resume behavior, and production network conditions remain unverified. HTTP request-context tests do not establish device compatibility.

## Reproduce

With the project's dependencies installed and local MP3s restored:

```sh
npm run lint
npm run test:audio
npm run check:audio
npm run build
npm run start
```

In another terminal, while the local production server is running:

```sh
npm run test:audio:http
```

Set `AUDIO_TEST_BASE_URL` to test a different local server port. Before publishing, verify playback, seeking, track switching, pause during loading, autoplay, and recovery on representative mobile and desktop browsers, and verify that opening an audio URL directly fails after visiting the music page.
