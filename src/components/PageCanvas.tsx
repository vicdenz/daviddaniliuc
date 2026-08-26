"use client";

import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";

const InfrastructureBackdrop = lazy(() => import("@/components/InfrastructureBackdrop"));

interface PageCanvasProps {
	children: ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
	const [graphicsReady, setGraphicsReady] = useState(false);

	useEffect(() => {
		const idleCallback = window.requestIdleCallback(() => setGraphicsReady(true), { timeout: 250 });
		return () => window.cancelIdleCallback(idleCallback);
	}, []);

	return (
		<div className="page-canvas">
			{graphicsReady ? (
				<Suspense fallback={null}>
					<InfrastructureBackdrop />
				</Suspense>
			) : null}
			<div className="page-content">{children}</div>
		</div>
	);
}
