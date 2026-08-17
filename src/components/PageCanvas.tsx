"use client";

import { lazy, Suspense, type ReactNode, useEffect, useState } from "react";

const InfrastructureBackdrop = lazy(() => import("@/components/InfrastructureBackdrop"));

interface PageCanvasProps {
	children: ReactNode;
	className?: string;
}

export default function PageCanvas({ children, className = "" }: PageCanvasProps) {
	const [graphicsReady, setGraphicsReady] = useState(false);

	useEffect(() => {
		const idleCallback = window.requestIdleCallback(() => setGraphicsReady(true), { timeout: 800 });
		return () => window.cancelIdleCallback(idleCallback);
	}, []);

	return (
		<div className={`page-canvas ${className}`}>
			{graphicsReady ? (
				<Suspense fallback={null}>
					<InfrastructureBackdrop />
				</Suspense>
			) : null}
			<div className="page-content">{children}</div>
		</div>
	);
}
