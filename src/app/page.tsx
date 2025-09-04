import PageCanvas from "@/components/PageCanvas";
import ProjectCard from "@/components/ProjectCard";
import ContactButton from "@/components/ContactButton";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";

export default function Home() {
	return (
		<PageCanvas>
			{/* Responsive Header/Sidebar */}
			<div className="lg:fixed lg:bottom-0 lg:p-8 lg:mb-8 p-8 pb-0 lg:pb-8">
				<div className="animate-fade-in-scale">
					<div className="mb-4">
						<h1 className="font-heading text-5xl text-stone-gray-light font-bold">david daniliuc</h1>
					</div>
					<ul className="space-y-3 hidden lg:block">
						<li className="flex items-center gap-3 animate-fade-in-left delay-300">
							<svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2 C12 6 16 12 22 12 C16 12 12 18 12 22 C12 18 8 12 2 12 C8 12 12 6 12 2 Z" />
							</svg>
							<p className="font-sans text-stone-gray text-lg leading-relaxed font-light">cloudops engineer @ MPAC</p>
						</li>
						<li className="flex items-center gap-3 animate-fade-in-left delay-500">
							<svg className="w-4 h-4 text-stone-gray flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2 C12 6 16 12 22 12 C16 12 12 18 12 22 C12 18 8 12 2 12 C8 12 12 6 12 2 Z" />
							</svg>
							<p className="font-sans text-stone-gray text-lg leading-relaxed font-light">computer science @ UofT</p>
						</li>
					</ul>
				</div>
			</div>

			{/* Main Content Area */}
			<main className="flex-1 lg:ml-94 p-8 pt-2 lg:pt-10">
				{/* About Section */}
				<section className="mb-12 animate-fade-in-scale delay-200">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold pb-1">About Me</h2>
					<div className="content-hr p-6 pt-4 animate-fade-in-scale delay-200">
						<p className="font-display text-stone-gray leading-relaxed mb-4">{"I'm a Computer Science Specialist student at the University of Toronto - St. George campus with a focus on computer systems. Previously working as a CloudOps Analyst Intern at MPAC."}</p>
						<p className="font-display text-stone-gray leading-relaxed">{"When I'm not coding with the latest technologies, you can find me producing electronic music, DJing, and checking out new spots in Toronto."}</p>
					</div>
				</section>

				{/* Projects Section */}
				<section className="mb-12 animate-fade-in-scale delay-400">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold pb-1">Projects</h2>
					<div className="content-hr p-6 pt-4">
						<div className="space-y-8">
							<ProjectCard className="animate-fade-in-scale delay-400" title="StudyUp" description="StudyUp is an AI-powered learning companion that centralizes course materials into a personalized tutor to help students study smarter and manage their academic journey. Won Lovable x Roam International Hackathon, 15K+ CAD Prize, Flown to San Francisco Demo Day" technologies={["Next.js", "TypeScript", "Supabase", "Postgres", "Tailwind CSS", "Google Gemini"]} />
							<ProjectCard className="animate-fade-in-scale delay-400" title="Indus" description="Indus is an intelligent financial analysis platform with a responsive dashboard that delivers real-time market data, dynamic TradingView trend visualizations, and AI-driven contextual insights for both stock and crypto." technologies={["Next.js", "TypeScript", "WebSocket", "Alpaca", "Yahoo Finance", "TradingView", "Google Gemini", "Tailwind CSS"]} />
						</div>
					</div>
				</section>

				{/* Contact Section */}
				<section className="animate-fade-in-scale delay-600">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold pb-1">Get In Touch</h2>
					<div className="content-hr p-6 pt-4 animate-fade-in-scale delay-600">
						<p className="font-display text-stone-gray leading-relaxed mb-6">{"I'm always interested in new opportunities and contributing to interesting projects. Feel free to reach out!"}</p>
						<div className="flex gap-4">
							<ContactButton icon={faEnvelope} href="mailto:david.daniliuc@mail.utoronto.ca" />
							<ContactButton icon={faLinkedin} text="" href="https://www.linkedin.com/in/david-daniliuc/" />
							<ContactButton icon={faGithub} text="" href="https://github.com/vicdenz/" />
						</div>
					</div>
				</section>
			</main>
		</PageCanvas>
	);
}
