"use client";

import { lazy, Suspense, type ReactNode } from "react";

const InfrastructureBackdrop = lazy(() => import("@/components/InfrastructureBackdrop"));

interface PageCanvasProps {
	children: ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
	return (
		<div className="page-canvas">
			<Suspense fallback={null}>
				<InfrastructureBackdrop />
			</Suspense>
			<div className="page-content">{children}</div>
		</div>
	);
}
