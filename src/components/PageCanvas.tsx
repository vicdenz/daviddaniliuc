"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type TransitionEvent, type ReactNode } from "react";

import { SITE_ANIMATION } from "@/components/backdrop/config";
import { PageReadyProvider } from "@/components/PageReadyContext";

// Start fetching the graphics bundle as soon as the page shell hydrates rather
// than waiting for Suspense to render the lazy component.
const topographicBackdropModule = import("@/components/TopographicBackdrop");
const TopographicBackdrop = lazy(() => topographicBackdropModule);
const pageAnimationStyle = {
	"--loader-fade-duration": `${SITE_ANIMATION.loaderFadeMs}ms`,
	"--loader-fade-easing": SITE_ANIMATION.loaderFadeEasing,
	"--loader-fallback-delay": `${SITE_ANIMATION.loaderFallbackMs}ms`,
	"--backdrop-fade-duration": `${SITE_ANIMATION.backdropFadeMs}ms`,
	"--backdrop-fade-easing": SITE_ANIMATION.backdropFadeEasing,
	"--content-reveal-duration": `${SITE_ANIMATION.contentRevealMs}ms`,
	"--content-reveal-easing": SITE_ANIMATION.revealEasing,
	"--content-reveal-delay": `${SITE_ANIMATION.contentRevealDelayMs}ms`,
	"--section-divider-reveal-delay": `${SITE_ANIMATION.sectionDividerRevealDelayMs}ms`,
	"--section-divider-reveal-duration": `${SITE_ANIMATION.sectionDividerRevealMs}ms`,
	"--section-divider-reveal-easing": SITE_ANIMATION.revealEasing,
	"--section-divider-reveal-stagger": `${SITE_ANIMATION.sectionDividerRevealStaggerMs}ms`,
	"--content-reveal-delay-0": `${SITE_ANIMATION.contentRevealStaggerMs[0]}ms`,
	"--content-reveal-delay-100": `${SITE_ANIMATION.contentRevealStaggerMs[100]}ms`,
	"--content-reveal-delay-200": `${SITE_ANIMATION.contentRevealStaggerMs[200]}ms`,
	"--content-reveal-delay-300": `${SITE_ANIMATION.contentRevealStaggerMs[300]}ms`,
	"--content-reveal-delay-500": `${SITE_ANIMATION.contentRevealStaggerMs[500]}ms`,
} as CSSProperties;

interface PageCanvasProps {
	children: ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
	const [loaderPhase, setLoaderPhase] = useState<"loading" | "fading" | "ready">("loading");
	const exitStarted = useRef(false);
	const readyFrame = useRef<number | null>(null);
	const transitionFallback = useRef<number | null>(null);

	const finishLoader = useCallback(() => {
		if (readyFrame.current !== null) return;
		if (transitionFallback.current !== null) {
			window.clearTimeout(transitionFallback.current);
			transitionFallback.current = null;
		}

		readyFrame.current = window.requestAnimationFrame(() => {
			readyFrame.current = null;
			setLoaderPhase("ready");
		});
	}, []);

	const exitLoader = useCallback(() => {
		if (exitStarted.current) return;
		exitStarted.current = true;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setLoaderPhase("ready");
			return;
		}

		setLoaderPhase("fading");
		transitionFallback.current = window.setTimeout(finishLoader, SITE_ANIMATION.loaderFadeMs + 50);
	}, [finishLoader]);

	useEffect(() => {
		const fallbackTimer = window.setTimeout(exitLoader, SITE_ANIMATION.loaderFallbackMs);
		return () => {
			window.clearTimeout(fallbackTimer);
			if (transitionFallback.current !== null) window.clearTimeout(transitionFallback.current);
			if (readyFrame.current !== null) window.cancelAnimationFrame(readyFrame.current);
		};
	}, [exitLoader]);

	useEffect(() => {
		const previousScrollRestoration = window.history.scrollRestoration;
		window.history.scrollRestoration = "manual";
		window.scrollTo(0, 0);

		return () => {
			window.history.scrollRestoration = previousScrollRestoration;
		};
	}, []);

	const handleBackdropReady = useCallback(() => {
		const fontsReady = document.fonts?.ready ?? Promise.resolve();
		void fontsReady.then(exitLoader);
	}, [exitLoader]);

	const pageReady = loaderPhase === "ready";
	const loaderVisible = loaderPhase === "loading";
	const handleLoaderTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
		if (event.propertyName === "opacity" && loaderPhase === "fading") finishLoader();
	};

	return (
		<PageReadyProvider value={pageReady}>
			<div className="page-canvas" style={pageAnimationStyle}>
				{loaderPhase !== "ready" && <div className={`page-loader${loaderVisible ? "" : " page-loader-hidden"}`} aria-hidden="true" onTransitionEnd={handleLoaderTransitionEnd} />}
				<Suspense fallback={null}>
					<TopographicBackdrop onReady={handleBackdropReady} reveal={pageReady} />
				</Suspense>
				<div className={`page-content${pageReady ? " page-content-ready" : ""}`}>{children}</div>
			</div>
		</PageReadyProvider>
	);
}
