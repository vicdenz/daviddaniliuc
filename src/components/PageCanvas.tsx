"use client";

import { lazy, Suspense, type ReactNode } from "react";

// Start fetching the graphics bundle as soon as the page shell hydrates rather
// than waiting for Suspense to render the lazy component.
const topographicBackdropModule = import("@/components/TopographicBackdrop");
const TopographicBackdrop = lazy(() => topographicBackdropModule);

interface PageCanvasProps {
	children: ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
	return (
		<div className="page-canvas">
			<Suspense fallback={null}>
				<TopographicBackdrop />
			</Suspense>
			<div className="page-content">{children}</div>
		</div>
	);
}
