export type Experience = {
	period: string;
	company: string;
	role: string;
	description: string;
	detail: string;
};

export type Project = {
	category: string;
	title: string;
	stack: string;
	description: string;
	href: string;
	repo: string;
};

export const experiences = [
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
] satisfies readonly Experience[];

export const projects = [
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
] satisfies readonly Project[];
