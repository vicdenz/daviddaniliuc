import PageCanvas from "@/components/PageCanvas";

export default function Home() {
	return (
		<PageCanvas>
			<div className="blueprint-shell" id="top">
				<header className="plan-header">
					<a className="nameplate" href="#top">David Daniliuc</a>
					<p>Infrastructure engineer<br />Toronto, Canada</p>
					<nav aria-label="Primary navigation">
						<a href="#practice">Practice</a>
						<a href="#work">Work</a>
						<a href="mailto:david.daniliuc24@gmail.com">Contact</a>
					</nav>
				</header>

				<main>
					<section className="plan-hero" aria-labelledby="hero-title">
						<div className="drawing-key" aria-hidden="true">
							<span>DD–01</span>
							<span>2026</span>
						</div>
						<div className="hero-statement">
							<p className="kicker">Software, underneath</p>
							<h1 id="hero-title">I design systems for building, shipping, and understanding software.</h1>
							<p className="summary">I&apos;m David, a computer science and mathematics student at the University of Toronto, currently working on continuous integration infrastructure at Shopify.</p>
						</div>
					</section>

					<section className="plan-section" id="practice" aria-labelledby="practice-title">
						<div className="section-code">A / Practice</div>
						<h2 id="practice-title">The invisible layer should feel dependable.</h2>
						<div className="practice-notes">
							<p>I like infrastructure that gives engineers clear feedback, sensible defaults, and fewer reasons to think about infrastructure.</p>
							<ul>
								<li>Continuous integration</li>
								<li>Developer experience</li>
								<li>Reliability and observability</li>
								<li>Systems interfaces</li>
							</ul>
						</div>
					</section>

					<section className="plan-section work-plan" id="work" aria-labelledby="work-title">
						<div className="section-code">B / Selected work</div>
						<h2 id="work-title">Things I&apos;ve shipped.</h2>
						<div className="project-list">
							<a href="https://study-up.lovable.app/" target="_blank" rel="noreferrer">
								<span className="project-number">01</span>
								<div><strong>StudyUp</strong><p>An AI academic planner built in under eight hours and awarded first place at the Lovable × Roam hackathon.</p></div>
								<span className="project-link">View ↗</span>
							</a>
							<a href="https://indus-trade.vercel.app/" target="_blank" rel="noreferrer">
								<span className="project-number">02</span>
								<div><strong>Indus</strong><p>A financial analysis platform combining realtime market data, interactive charts, and contextual AI.</p></div>
								<span className="project-link">View ↗</span>
							</a>
						</div>
					</section>

					<section className="personal-strip">
						<div className="section-code">C / After hours</div>
						<p>Electronic music, DJing, and finding new corners of Toronto.</p>
					</section>
				</main>

				<footer>
					<a href="mailto:david.daniliuc24@gmail.com">david.daniliuc24@gmail.com</a>
					<div><a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer">LinkedIn</a></div>
				</footer>
			</div>
		</PageCanvas>
	);
}
