import { education, experiences, projects } from "@/content/portfolio";
import LinkIcon from "@/components/LinkIcon";

import ExperienceList from "./ExperienceList";
import NameUnderline from "./NameUnderline";
import styles from "./Portfolio.module.css";
import ProjectList from "./ProjectList";
import SectionDivider from "./SectionDivider";

export default function Portfolio() {
	return (
		<main className={`site-page ${styles.portfolio}`}>
			<section className={`${styles.introduction} reveal reveal-from-bottom reveal-offset-24 reveal-0`} aria-labelledby="intro-title">
				<div className={styles.introCopy}>
					<h1 id="intro-title">I&apos;m <NameUnderline>David Daniliuc</NameUnderline>,<br />a cs student into building systems & making music;</h1>
				</div>
				<nav className={styles.headerLinks} aria-label="Social links">
					<a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer" aria-label="GitHub"><LinkIcon name="github" /></a>
					<a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkIcon name="linkedin" /></a>
					<a href="mailto:david.daniliuc24@gmail.com" aria-label="Email David Daniliuc"><LinkIcon name="email" /></a>
					<a href="https://x.com/daviddaniliuc_" target="_blank" rel="noreferrer" aria-label="X"><LinkIcon name="twitter" /></a>
				</nav>
			</section>

			<SectionDivider label="learning" />
			<ExperienceList entries={education} label="Education" reveal="reveal reveal-from-right reveal-offset-24 reveal-100" />
			<SectionDivider delay="late" label="working" />
			<ExperienceList entries={experiences} label="Experience" reveal="reveal reveal-from-right reveal-offset-24 reveal-200" />
			<SectionDivider delay="last" label="building" />
			<ProjectList projects={projects} />
		</main>
	);
}
