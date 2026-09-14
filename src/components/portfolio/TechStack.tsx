"use client";

import { useLayoutEffect, useRef } from "react";

import styles from "./Portfolio.module.css";

type TechStackProps = {
	technologies: readonly string[];
};

export default function TechStack({ technologies }: TechStackProps) {
	const stackRef = useRef<HTMLParagraphElement>(null);

	useLayoutEffect(() => {
		const stack = stackRef.current;
		if (!stack) return;

		const updateSeparators = () => {
			let previousTop: number | undefined;

			for (const item of stack.children) {
				const element = item as HTMLElement;
				const top = element.offsetTop;
				const startsLine = previousTop === undefined || top !== previousTop;
				element.toggleAttribute("data-line-start", startsLine);
				previousTop = top;
			}
		};

		const observer = new ResizeObserver(updateSeparators);
		observer.observe(stack);
		updateSeparators();

		return () => observer.disconnect();
	}, [technologies]);

	return (
		<p ref={stackRef} className={styles.projectStack} aria-label={`Technology stack: ${technologies.join(", ")}`}>
			{technologies.map((technology, index) => (
				<span className={styles.projectTechnology} data-line-start={index === 0 ? "" : undefined} key={`${technology}-${index}`} aria-hidden="true">
					<span className={styles.projectSeparator}>·</span>
					{technology}
				</span>
			))}
		</p>
	);
}
