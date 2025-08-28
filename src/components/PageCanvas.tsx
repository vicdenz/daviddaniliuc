"use client";

import { Canvas } from "@react-three/fiber";
import { ReactNode } from "react";
import ShaderPlane from "@/components/ShaderPlane";

interface ShaderPlaneProps {
	children: ReactNode;
	className?: string;
}

export default function PageCanvas({ children, className = "" }: ShaderPlaneProps) {
	return (
		<div className={`relative min-h-screen ${className}`}>
			{/* Three.js Canvas Background */}
			<div className="fixed inset-0 -z-10">
				<Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
					<ShaderPlane />
				</Canvas>
			</div>

			{/* Page Content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
}
