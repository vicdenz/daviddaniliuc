import type { Experience } from "@/content/portfolio";

import styles from "./Journal.module.css";

type ExperienceListProps = {
	experiences: readonly Experience[];
};

export default function ExperienceList({ experiences }: ExperienceListProps) {
	return (
		<section className={`${styles.index} reveal reveal-from-right reveal-offset-24 reveal-200`} aria-label="Experience">
			{experiences.map((experience) => (
				<article className={styles.entry} key={experience.company}>
					<div className={styles.entryCopy}>
						<h2>{experience.company} <span className={styles.entryPeriod}>({experience.period})</span></h2>
						<p className={styles.entryRole}>{experience.role}</p>
						<p>{experience.description}</p>
						<p className={styles.entryDetail}>{experience.detail}</p>
					</div>
				</article>
			))}
		</section>
	);
}
