import { education, experiences, projects } from "@/content/portfolio";

import ExperienceList from "./ExperienceList";
import styles from "./Journal.module.css";
import LinkIcon from "./LinkIcon";
import NameUnderline from "./NameUnderline";
import ProjectList from "./ProjectList";

export default function Journal() {
	return (
		<main className={styles.journal}>
			<section className={`${styles.introduction} reveal reveal-from-bottom reveal-offset-24 reveal-0`} aria-labelledby="intro-title">
				<div>
					<h1 id="intro-title">I&apos;m <NameUnderline>David Daniliuc</NameUnderline>,<br />a CS student into building systems & making music.</h1>
				</div>
			</section>

			<ExperienceList entries={education} label="Education" reveal="reveal reveal-from-right reveal-offset-24 reveal-100" />
			<hr className={`${styles.sectionDivider} section-divider`} />
			<ExperienceList entries={experiences} label="Experience" reveal="reveal reveal-from-right reveal-offset-24 reveal-200" />
			<hr className={`${styles.sectionDivider} ${styles.sectionDividerLate} section-divider`} />
			<ProjectList projects={projects} />
			<footer className={`${styles.footer} reveal reveal-from-bottom reveal-offset-12 reveal-500`}>
				<p>lifemaxxing</p>
				<div className={styles.links}>
					<a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer"><LinkIcon name="github" />GitHub</a>
					<a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer"><LinkIcon name="linkedin" />LinkedIn</a>
					<a href="https://x.com/daviddaniliuc_" target="_blank" rel="noreferrer"><LinkIcon name="twitter" />Twitter</a>
				</div>
			</footer>
		</main>
	);
}
