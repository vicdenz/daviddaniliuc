"use client";

import { lazy, Suspense, type ReactNode } from "react";

const TopographicBackdrop = lazy(() => import("@/components/TopographicBackdrop"));

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
