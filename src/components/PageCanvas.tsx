import { type ReactNode } from "react";
import InfrastructureBackdrop from "@/components/InfrastructureBackdrop";

interface PageCanvasProps {
	children: ReactNode;
	className?: string;
}

export default function PageCanvas({ children, className = "" }: PageCanvasProps) {
	return (
		<div className={`page-canvas ${className}`}>
			<InfrastructureBackdrop />
			<div className="page-content">{children}</div>
		</div>
	);
}
