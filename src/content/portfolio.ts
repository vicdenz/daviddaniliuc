export type OrganizationEntry = {
	period?: string;
	organization: string;
	role: string;
	description: string;
	logo: string;
	logoScale?: number;
	href: string;
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
		period: "May — Aug 2026",
		organization: "Shopify",
		role: "Software Engineer Intern",
		description: "Monorepo CI migration, self-healing merge queues, build-time and compute optimization, race-condition detection.",
		logo: "/logos/shopify.svg",
		href: "https://www.shopify.com/",
	},
	{
		period: "Jan — Apr 2026",
		organization: "UTMIST",
		role: "Software Engineer",
		description: "Multi-tenant MCP gateway, AWS ECS Fargate, encrypted OAuth, dynamic Google Workspace and Slack tool discovery.",
		logo: "/logos/utmist.svg",
		href: "https://www.utmist.ca/",
	},
	{
		period: "May — Aug 2025",
		organization: "MPAC",
		role: "Software Engineer Intern",
		description: "AWS cost optimization, Kubernetes at municipal scale, 100GB+ PostgreSQL cross-cloud migration.",
		logo: "/logos/mpac-mark.png",
		logoScale: 1.16,
		href: "https://www.mpac.ca/",
	},
] satisfies readonly OrganizationEntry[];

export const education = [
	{
		organization: "University of Toronto",
		role: "Computer Science & Mathematics",
		description: "Studying computer science and mathematics.",
		logo: "/logos/university-of-toronto-crest.png",
		logoScale: 1.16,
		href: "https://www.utoronto.ca/",
	},
] satisfies readonly OrganizationEntry[];

export const projects = [
	{
		category: "Learning tools",
		title: "StudyUp",
		stack: "React · TypeScript · Supabase · Gemini",
		description: "StudyUp is an AI study copilot for grounded tutoring and personalized study plans, built in eight hours and winner of the Lovable × Roam international hackathon and a US$10,000 prize.",
		href: "https://study-up-pi.vercel.app/",
		repo: "https://github.com/vicdenz/study-up",
	},
	{
		category: "Financial systems",
		title: "Indus",
		stack: "Rails · Rust · Kafka · Temporal · AWS",
		description: "Indus is a live market-research and portfolio workspace that turns real-time data into sharper investing decisions.",
		href: "https://indus-trade.vercel.app/",
		repo: "https://github.com/vicdenz/indus",
	},
] satisfies readonly Project[];
