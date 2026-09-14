export type OrganizationEntry = {
	period?: string;
	organization: string;
	role?: string;
	description: string;
	logo: string;
	logoScale?: number;
	href: string;
};

export type Project = {
	title: string;
	stack: readonly string[];
	description: string;
	href: string;
	repo: string;
};

export const experiences = [
	{
		period: "May — Aug 2026",
		organization: "Shopify",
		role: "Software Engineer Intern",
		description: "Organization-wide migration toward internally built developer tooling, performance tuning for Shopify’s Git service, automated merge-queue recovery.",
		logo: "/logos/shopify.svg",
		href: "https://www.shopify.com/",
	},
	{
		period: "Jan — Apr 2026",
		organization: "UTMIST",
		role: "Software Engineer",
		description: "Multi-tenant MCP gateway for enterprise AI agents, dynamic tool discovery, encrypted OAuth, and AWS Fargate deployment.",
		logo: "/logos/utmist.svg",
		href: "https://www.utmist.ca/",
	},
	{
		period: "Sep 2025 — Apr 2026",
		organization: "aUToronto",
		role: "Software Engineer",
		description: "Human-machine interface for a GM/SAE autonomous vehicle, ROS navigation guidance, real-time LiDAR, camera and telemetry visualization.",
		logo: "/logos/autoronto-mark.webp",
		logoScale: 1.16,
		href: "https://www.autodrive.utoronto.ca/",
	},
	{
		period: "May — Aug 2025",
		organization: "MPAC",
		role: "Software Engineer Intern",
		description: "Kubernetes infrastructure for municipal staff across Ontario, AWS cost optimization, 100GB+ PostgreSQL DB migration.",
		logo: "/logos/mpac-mark.svg",
		logoScale: 1.16,
		href: "https://www.mpac.ca/",
	},
] satisfies readonly OrganizationEntry[];

export const education = [
	{
		period: "Expected Aug 2028",
		organization: "University of Toronto",
		description: "Pursuing Computer Science Specialist and Mathematics Major.",
		logo: "/logos/university-of-toronto-crest.png",
		logoScale: 1.16,
		href: "https://www.utoronto.ca/",
	},
] satisfies readonly OrganizationEntry[];

export const projects = [
	{
		title: "StudyUp",
		stack: ["React", "TypeScript", "Supabase", "Gemini", "Vite"],
		description: "AI workspace for context-aware tutoring, personalized study plans; built in under eight hours, won first place and $10,000 USD prize at the Lovable x UTMIST International Hackathon, invited to San Francisco to showcase",
		href: "https://study-up-pi.vercel.app/",
		repo: "https://github.com/vicdenz/study-up",
	},
	{
		title: "Indus",
		stack: ["React", "TypeScript", "Rails", "Rust", "Kafka", "PostgreSQL", "AWS", "Terraform", "Helm"],
		description: "Financial intelligence platform for live market research, portfolio tracking, streaming charts, and AI-powered reports.",
		href: "https://indus-trade.vercel.app/",
		repo: "https://github.com/TryIndus/indus",
	},
] satisfies readonly Project[];
