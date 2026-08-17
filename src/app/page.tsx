import PageCanvas from "@/components/PageCanvas";

export default function Home() {
	return (
		<PageCanvas>
			<main className="newspaper">
				<section className="intro" aria-labelledby="intro-title">
					<h1 id="intro-title">I&apos;m David, an infrastructure engineer based in Toronto.</h1>
					<p>
						I&apos;m currently working on continuous integration infrastructure at Shopify while studying computer science and mathematics at the University of Toronto.
					</p>
					<p>
						I like building reliable systems, improving developer experience, and making complicated machinery easier to use.
					</p>
				</section>

				<section aria-labelledby="highlights-title">
					<h2 id="highlights-title">Recent highlights</h2>
					<div className="story-list">
						<p>
							Built <a href="https://study-up.lovable.app/" target="_blank" rel="noreferrer">StudyUp ↗</a>, an AI academic planner that won first place at the Lovable × Roam international hackathon.
						</p>
						<p>
							Built <a href="https://indus-trade.vercel.app/" target="_blank" rel="noreferrer">Indus ↗</a>, a financial analysis platform combining realtime market data, interactive charts, and contextual AI.
						</p>
					</div>
				</section>

				<section aria-labelledby="experience-title">
					<h2 id="experience-title">Experience &amp; education</h2>
					<div className="index-list">
						<div className="index-row">
							<div><strong>Shopify</strong><span>Infrastructure Engineering</span></div>
							<p>Continuous integration</p>
						</div>
						<div className="index-row">
							<div><strong>University of Toronto</strong><span>Computer Science + Mathematics</span></div>
							<p>St. George</p>
						</div>
					</div>
				</section>

				<section aria-labelledby="outside-title">
					<h2 id="outside-title">Outside software</h2>
					<p className="single-story">I produce electronic music, DJ, and look for new places around Toronto.</p>
				</section>

				<footer>
					<div className="links">
						<a href="mailto:david.daniliuc24@gmail.com">Email</a>
						<a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer">GitHub</a>
						<a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer">LinkedIn</a>
					</div>
					<span>David Daniliuc</span>
				</footer>
			</main>
		</PageCanvas>
	);
}
