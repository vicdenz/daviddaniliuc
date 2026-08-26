import { experiences, projects } from "@/content/portfolio";

import ExperienceList from "./ExperienceList";
import styles from "./Journal.module.css";
import ProjectList from "./ProjectList";

export default function Journal() {
	return (
		<main className={styles.journal}>
			<header className={styles.masthead}>
				<div>
					<strong>David Daniliuc</strong>
					<span>Toronto, Canada</span>
				</div>
			</header>

			<section className={styles.introduction} aria-labelledby="intro-title">
				<p className={styles.sectionMark}>About</p>
				<div>
					<h1 id="intro-title">I&apos;m an infrastructure engineer who likes making complex systems feel calm.</h1>
					<p>I work on continuous integration at Shopify and study computer science and mathematics at the University of Toronto.</p>
				</div>
			</section>

			<ExperienceList experiences={experiences} />
			<ProjectList projects={projects} />

			<section className={styles.colophon} aria-labelledby="elsewhere-title">
				<p className={styles.sectionMark}>Elsewhere</p>
				<div>
					<h2 id="elsewhere-title">Away from software</h2>
					<p>I produce electronic music, DJ, and look for new places around Toronto.</p>
				</div>
			</section>

			<footer className={styles.footer}>
				<p>Say hello.</p>
				<div className={styles.links}>
					<a href="mailto:david.daniliuc24@gmail.com">Email</a>
					<a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer">GitHub</a>
					<a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer">LinkedIn</a>
				</div>
			</footer>
		</main>
	);
}
