import type { Project } from "@/content/portfolio";

import styles from "./Journal.module.css";

type ProjectListProps = {
	projects: readonly Project[];
};

export default function ProjectList({ projects }: ProjectListProps) {
	return (
		<section className={`${styles.index} reveal reveal-from-left reveal-offset-24 reveal-300`} aria-label="Selected projects">
			{projects.map((project) => (
				<article className={styles.entry} key={project.title}>
					<div className={styles.entryCopy}>
						<h2>{project.title}</h2>
						<p className={styles.entryRole}>{project.category} · {project.stack}</p>
						<p>{project.description}</p>
						<div className={styles.projectLinks}>
							<a href={project.href} target="_blank" rel="noreferrer">Visit ↗</a>
							<a href={project.repo} target="_blank" rel="noreferrer">Source ↗</a>
						</div>
					</div>
				</article>
			))}
		</section>
	);
}
