import type { Experience } from "@/content/portfolio";

import styles from "./Journal.module.css";

type ExperienceListProps = {
	experiences: readonly Experience[];
};

export default function ExperienceList({ experiences }: ExperienceListProps) {
	return (
		<section className={styles.index} aria-labelledby="experience-title">
			<div className={styles.indexHeading}>
				<h2 className={styles.sectionMark} id="experience-title">Experience</h2>
				<span>{experiences.length} roles</span>
			</div>

			{experiences.map((experience) => (
				<article className={styles.entry} key={experience.company}>
					<div className={styles.entryMeta}>
						<span>{experience.period}</span>
						<span>{experience.role}</span>
					</div>
					<div className={styles.entryCopy}>
						<h3>{experience.company}</h3>
						<p>{experience.description}</p>
						<p className={styles.entryDetail}>{experience.detail}</p>
					</div>
				</article>
			))}
		</section>
	);
}
