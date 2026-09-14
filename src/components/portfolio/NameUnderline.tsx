"use client";

import { annotate } from "rough-notation";
import { useEffect, useRef, type ReactNode } from "react";

import { SITE_ANIMATION } from "@/components/backdrop/config";
import { usePageReady } from "@/components/PageReadyContext";

type NameUnderlineProps = {
	children: ReactNode;
};

const getUnderlineOffset = (element: HTMLElement) => -0.12 * Number.parseFloat(getComputedStyle(element).fontSize);

export default function NameUnderline({ children }: NameUnderlineProps) {
	const nameRef = useRef<HTMLSpanElement>(null);
	const pageReady = usePageReady();

	useEffect(() => {
		const element = nameRef.current;
		if (!element || !pageReady) return;

		const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
		let annotation: ReturnType<typeof annotate> | null = null;
		let resizeFrame: number | null = null;
		const redrawForResize = () => {
			if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
			resizeFrame = window.requestAnimationFrame(() => {
				resizeFrame = null;
				if (annotation) annotation.padding = [0, 0, getUnderlineOffset(element), 0];
			});
		};

		window.addEventListener("resize", redrawForResize, { passive: true });
		const delay = window.setTimeout(() => {
			annotation = annotate(element, {
				type: "underline",
				color: "#2457d6",
				strokeWidth: 3,
				padding: [0, 0, getUnderlineOffset(element), 0],
				iterations: 1,
				multiline: true,
				animate: !reduceMotion,
				animationDuration: 520,
			});
			annotation.show();
		}, SITE_ANIMATION.nameUnderlineDelayMs);

		return () => {
			window.clearTimeout(delay);
			window.removeEventListener("resize", redrawForResize);
			if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
			annotation?.remove();
		};
	}, [pageReady]);

	return <span className="name-underline" ref={nameRef}>{children}</span>;
}
