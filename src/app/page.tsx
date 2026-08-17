import PageCanvas from "@/components/PageCanvas";

const experience = [
	{
		period: "May 2026 — now",
		company: "Shopify",
		role: "Software Engineer Intern · Infrastructure",
		description: "Working on continuous integration for Shopify’s monorepo: moving services onto shared CI orchestration, making internal Git pipelines faster, and automating recovery for stuck merge queues.",
		detail: "One pipeline change cut median unit-test time roughly in half and saved more than 700 compute hours across 10,000+ builds.",
	},
	{
		period: "Jan — Apr 2026",
		company: "UTMIST",
		role: "Software Engineer",
		description: "Built a multi-tenant gateway that gives AI agents one authenticated path into enterprise tools, with encrypted OAuth and dynamic discovery for Google Workspace and Slack.",
		detail: "Designed the cloud architecture as nine containerized services running on AWS ECS Fargate.",
	},
	{
		period: "May — Aug 2025",
		company: "MPAC",
		role: "Software Engineer Intern",
		description: "Worked across cloud provisioning, service delivery, and data migration: reducing AWS spend, deploying Kubernetes workloads, and moving a large PostgreSQL system from RDS to Azure.",
		detail: "The work covered 15+ microservices and a 100GB+ production database migration.",
	},
];

const projects = [
	{
		category: "Learning tools",
		title: "StudyUp",
		stack: "React · TypeScript · Supabase · Gemini",
		description: "An AI workspace for learning course material through grounded tutoring and generated study plans. Built in under eight hours; winner of the Lovable × Roam international hackathon and US$10,000 prize.",
		href: "https://study-up-pi.vercel.app/",
		repo: "https://github.com/vicdenz/study-up",
	},
	{
		category: "Financial systems",
		title: "Indus",
		stack: "Rails · Rust · Kafka · Temporal · AWS",
		description: "A live market-research and portfolio platform. Its backend combines a Rails API, a Rust market-data service, Kafka delivery, Temporal workflows, and infrastructure defined for AWS with Terraform and Helm.",
		href: "https://indus-trade.vercel.app/",
		repo: "https://github.com/vicdenz/indus",
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
					<p>Infrastructure, software, and the systems around them.</p>
				</header>

				<section className="introduction" aria-labelledby="intro-title">
					<p className="section-mark">About</p>
					<div>
						<h1 id="intro-title">I&apos;m an infrastructure engineer who likes making complex systems feel calm.</h1>
						<p>I work on continuous integration at Shopify and study computer science and mathematics at the University of Toronto.</p>
					</div>
				</section>

				<section className="experience-index" aria-labelledby="experience-title">
					<div className="index-heading">
						<h2 className="section-mark" id="experience-title">Experience</h2>
						<span>{experience.length} roles</span>
					</div>
					{experience.map((item) => (
						<article className="experience-entry" key={item.company}>
							<div className="entry-meta">
								<span>{item.period}</span>
								<span>{item.role}</span>
							</div>
							<div className="entry-copy">
								<h3>{item.company}</h3>
								<p>{item.description}</p>
								<p className="entry-detail">{item.detail}</p>
							</div>
						</article>
					))}
				</section>

				<section className="project-index" aria-labelledby="projects-title">
					<div className="index-heading">
						<h2 className="section-mark" id="projects-title">Selected projects</h2>
						<span>{projects.length} entries</span>
					</div>
					{projects.map((project, index) => (
						<article className="project-entry" key={project.title}>
							<div className="entry-meta">
								<span>0{index + 1} · {project.category}</span>
								<span>{project.stack}</span>
							</div>
							<div className="entry-copy">
								<h3>{project.title}</h3>
								<p>{project.description}</p>
								<div className="project-links"><a href={project.href} target="_blank" rel="noreferrer">Visit ↗</a><a href={project.repo} target="_blank" rel="noreferrer">Source ↗</a></div>
							</div>
						</article>
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
