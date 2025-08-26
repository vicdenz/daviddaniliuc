import React, { ReactNode } from "react";

interface CardProps {
	size?: "small" | "medium" | "large" | "full";
	children: ReactNode;
	className?: string;
}

export default function Card({ size = "medium", children, className = "" }: CardProps) {
	const sizeClasses = {
		small: "p-4",
		medium: "p-6",
		large: "p-8",
		full: "p-6 md:p-8",
	};

	return <div className={`glass-card rounded-xl ${sizeClasses[size]} fade-in-section ${className}`}>{children}</div>;
}
