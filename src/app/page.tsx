import PageCanvas from "@/components/PageCanvas";

const projects = [
	{
		category: "Product · Education",
		title: "StudyUp",
		description: "An AI academic planner built in under eight hours and awarded first place at the Lovable × Roam international hackathon.",
		href: "https://study-up.lovable.app/",
	},
	{
		category: "Product · Financial systems",
		title: "Indus",
		description: "A financial analysis platform bringing realtime market data, interactive charts, and contextual AI into one interface.",
		href: "https://indus-trade.vercel.app/",
	},
];

export default function Home() {
	return (
		<PageCanvas>
			<main className="journal">
				<header className="masthead">
					<div>
						<strong>David Daniliuc</strong>
						<span>Toronto, Canada</span>
					</div>
					<p>Notes on infrastructure, software, and the systems around them.</p>
				</header>

				<section className="introduction" aria-labelledby="intro-title">
					<p className="section-mark">About</p>
					<div>
						<h1 id="intro-title">I&apos;m an infrastructure engineer who likes making complex systems feel calm.</h1>
						<p>
							I currently work on continuous integration infrastructure at Shopify while studying computer science and mathematics at the University of Toronto.
						</p>
					</div>
				</section>

				<section className="field-note" aria-labelledby="note-title">
					<div className="note-meta">
						<p className="section-mark">Working note 001</p>
						<span>Infrastructure</span>
					</div>
					<article>
						<h2 id="note-title">The best infrastructure reduces the amount of context an engineer has to carry.</h2>
						<p>
							That is what draws me to continuous integration, developer experience, reliability, and observability: turning complicated machinery into clear feedback and dependable paths.
						</p>
					</article>
				</section>

				<section className="project-index" aria-labelledby="projects-title">
					<div className="index-heading">
						<p className="section-mark" id="projects-title">Selected projects</p>
						<span>{projects.length} entries</span>
					</div>
					{projects.map((project, index) => (
						<a className="entry" href={project.href} target="_blank" rel="noreferrer" key={project.title}>
							<div className="entry-meta">
								<span>0{index + 1}</span>
								<span>{project.category}</span>
							</div>
							<div className="entry-copy">
								<h2>{project.title}</h2>
								<p>{project.description}</p>
							</div>
							<span className="entry-arrow" aria-hidden="true">↗</span>
						</a>
					))}
				</section>

				<section className="colophon" aria-labelledby="elsewhere-title">
					<p className="section-mark">Elsewhere</p>
					<div>
						<h2 id="elsewhere-title">Away from software</h2>
						<p>I produce electronic music, DJ, and look for new places around Toronto.</p>
					</div>
				</section>

				<footer>
					<p>Say hello.</p>
					<div className="links">
						<a href="mailto:david.daniliuc24@gmail.com">Email</a>
						<a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer">GitHub</a>
						<a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer">LinkedIn</a>
					</div>
				</footer>
			</main>
		</PageCanvas>
	);
}
