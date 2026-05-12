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
							<p className="font-sans text-stone-gray text-lg leading-relaxed font-light">infra @ Shopify</p>
						</li>
						<li className="flex items-center gap-3 animate-fade-in-left delay-500">
							<svg className="w-4 h-4 text-stone-gray flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2 C12 6 16 12 22 12 C16 12 12 18 12 22 C12 18 8 12 2 12 C8 12 12 6 12 2 Z" />
							</svg>
							<p className="font-sans text-stone-gray text-lg leading-relaxed font-light">cs & math @ UofT</p>
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
						<p className="font-display text-stone-gray leading-relaxed mb-4">{"I'm a Computer Science Specialist and Mathematics Major at the University of Toronto - St. George, currently interning as an Infrastructure Engineer on the Continuous Integration team at Shopify."}</p>
						<p className="font-display text-stone-gray leading-relaxed">{"When I'm not coding with the latest technologies, you can find me producing electronic music, DJing, and checking out new spots in Toronto."}</p>
					</div>
				</section>

				{/* Projects Section */}
				<section className="mb-12 animate-fade-in-scale delay-400">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold pb-1">Projects</h2>
					<div className="content-hr p-6 pt-4">
						<div className="space-y-8">
							<ProjectCard className="animate-fade-in-scale delay-400" title="StudyUp" href="https://study-up.lovable.app/" description="StudyUp is an AI academic planner delivering centralized course materials and calendars, real-time tutoring and study planners with analytics, progress tracking, and smart notifications. Won $10K USD 1st place at the Lovable x Roam International Hackathon hosted by UTMIST and The AI Collective." technologies={["React", "Vite", "TypeScript", "Supabase", "Tailwind CSS", "Vercel"]} />
							<ProjectCard className="animate-fade-in-scale delay-400" title="Indus" href="https://indus-trade.vercel.app/" description="Indus is an intelligent financial analysis platform with AI-powered insights for real-time market data, integrating TradingView trend charts with qualitative analysis through a contextual AI interface overlay." technologies={["React", "Next.js", "TypeScript", "socket.io", "Google Gemini", "Vercel"]} />
						</div>
					</div>
				</section>

				{/* Contact Section */}
				<section className="animate-fade-in-scale delay-600">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold pb-1">Get In Touch</h2>
					<div className="content-hr p-6 pt-4 animate-fade-in-scale delay-600">
						<p className="font-display text-stone-gray leading-relaxed mb-6">{"I'm always interested in new opportunities and contributing to interesting projects. Feel free to reach out!"}</p>
						<div className="flex gap-4">
							<ContactButton icon={faEnvelope} href="mailto:david.daniliuc24@gmail.com" />
							<ContactButton icon={faLinkedin} text="" href="https://www.linkedin.com/in/david-daniliuc/" />
							<ContactButton icon={faGithub} text="" href="https://github.com/vicdenz/" />
						</div>
					</div>
				</section>
			</main>
		</PageCanvas>
	);
}
