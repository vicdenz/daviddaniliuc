import type { Project } from "@/content/portfolio";
import LinkIcon from "@/components/LinkIcon";

import styles from "./Portfolio.module.css";

type ProjectListProps = {
	projects: readonly Project[];
};

export default function ProjectList({ projects }: ProjectListProps) {
	return (
		<section className={`${styles.index} reveal reveal-from-left reveal-offset-24 reveal-300`} aria-label="Selected projects">
			{projects.map((project) => (
				<article className={`${styles.entry} ${styles.projectEntry}`} key={project.title}>
					<div className={styles.entryCopy}>
						<div className={styles.projectHeader}>
							<h2><a className={styles.projectTitleLink} href={project.href} target="_blank" rel="noreferrer">{project.title}</a></h2>
							<div className={styles.projectLinks}>
								<a href={project.href} target="_blank" rel="noreferrer"><LinkIcon name="external" />Visit</a>
								<a href={project.repo} target="_blank" rel="noreferrer"><LinkIcon name="github" />Source</a>
							</div>
						</div>
						<p className={styles.projectStack}>{project.stack}</p>
						<p>{project.description}</p>
					</div>
				</article>
			))}
		</section>
	);
}
