import type { Project } from "@/content/portfolio";

import styles from "./Journal.module.css";

type ProjectListProps = {
	projects: readonly Project[];
};

export default function ProjectList({ projects }: ProjectListProps) {
	return (
		<section className={styles.index} aria-labelledby="projects-title">
			<div className={styles.indexHeading}>
				<h2 className={styles.sectionMark} id="projects-title">Selected projects</h2>
				<span>{projects.length} entries</span>
			</div>

			{projects.map((project, index) => (
				<article className={styles.entry} key={project.title}>
					<div className={styles.entryMeta}>
						<span>0{index + 1} · {project.category}</span>
						<span>{project.stack}</span>
					</div>
					<div className={styles.entryCopy}>
						<h3>{project.title}</h3>
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
