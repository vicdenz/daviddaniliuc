"use client";

import { useEffect, useState } from "react";

export default function Home() {
	const [scrollY, setScrollY] = useState(0);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll, { passive: true });

		// Intersection Observer for fade-in animations
		const observerOptions = {
			threshold: 0.1,
			rootMargin: "0px 0px -50px 0px",
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
				}
			});
		}, observerOptions);

		// Observe all sections for fade-in effect
		const sections = document.querySelectorAll(".fade-in-section");
		sections.forEach((section) => observer.observe(section));

		return () => {
			window.removeEventListener("scroll", handleScroll);
			observer.disconnect();
		};
	}, []);

	return (
		<div className="min-h-screen bg-washed-white text-deep-charcoal">
			{/* Main Content */}
			<main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
				{/* Header */}
				<header className="mb-16 animate-fade-in-up">
					<h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-deep-charcoal mb-6 leading-tight">
						i'm <span className="italic text-moss-green">david</span>, a thoughtful developer based in [your location].
					</h1>

					<p className="text-lg md:text-xl text-charcoal-soft leading-relaxed mb-8 animate-fade-in-up delay-200">I craft digital experiences with the same care and intentionality as tending a bonsai garden.</p>

					<div className="w-24 h-px bg-stone-gray mb-8 animate-fade-in delay-300"></div>
				</header>

				{/* Recent Highlights */}
				<section className="mb-16 fade-in-section">
					<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal mb-8">Recent Highlights</h2>

					<div className="space-y-6">
						<div className="group animate-fade-in-up delay-100">
							<p className="text-charcoal-soft leading-relaxed hover:text-deep-charcoal transition-colors duration-300">
								Built <span className="text-moss-green font-medium">ProjectName</span> (10,000+ users, featured on Product Hunt, interest from top-tier VCs)
							</p>
						</div>

						<div className="group animate-fade-in-up delay-200">
							<p className="text-charcoal-soft leading-relaxed hover:text-deep-charcoal transition-colors duration-300">
								Shipped <span className="text-moss-green font-medium">FastApp</span> in under 24 hours (1,000+ users, trending on Hacker News)
							</p>
						</div>

						<div className="group animate-fade-in-up delay-300">
							<p className="text-charcoal-soft leading-relaxed hover:text-deep-charcoal transition-colors duration-300">Led engineering team of 5+ developers, scaling platform to 50,000+ active users</p>
						</div>

						<div className="group animate-fade-in-up delay-400">
							<p className="text-charcoal-soft leading-relaxed hover:text-deep-charcoal transition-colors duration-300">
								Open-sourced <span className="text-moss-green font-medium">BonsaiLib</span> - minimalist design system (500+ GitHub stars)
							</p>
						</div>
					</div>

					<div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up delay-500">
						<a href="#projects" className="inline-flex items-center text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium group">
							Checkout what I've built
							<span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
						</a>
						<a href="#about" className="inline-flex items-center text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium group">
							Learn more about me
							<span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
						</a>
					</div>
				</section>

				{/* Experience */}
				<section className="mb-16 fade-in-section">
					<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal mb-8">Experience</h2>

					<div className="space-y-8">
						<div className="group hover:bg-stone-gray-light/20 rounded-lg p-4 -m-4 transition-all duration-300">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-moss-green/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-moss-green/20 transition-colors duration-300">
									<span className="text-lg">🏢</span>
								</div>
								<div className="flex-1">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
										<h3 className="font-heading text-lg text-deep-charcoal">
											<span className="text-moss-green font-medium">Company Name</span> (2024)
										</h3>
										<span className="text-sm text-charcoal-soft">Senior Developer, Remote</span>
									</div>
									<p className="text-charcoal-soft text-sm leading-relaxed">Led full-stack development, architected scalable systems, mentored junior developers</p>
								</div>
							</div>
						</div>

						<div className="group hover:bg-stone-gray-light/20 rounded-lg p-4 -m-4 transition-all duration-300">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-clay-red/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-clay-red/20 transition-colors duration-300">
									<span className="text-lg">🚀</span>
								</div>
								<div className="flex-1">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
										<h3 className="font-heading text-lg text-deep-charcoal">
											<span className="text-moss-green font-medium">Startup Inc</span> (2023 - 2024)
										</h3>
										<span className="text-sm text-charcoal-soft">Frontend Lead, San Francisco</span>
									</div>
									<p className="text-charcoal-soft text-sm leading-relaxed">Built design systems, optimized performance, shipped features to 100k+ users</p>
								</div>
							</div>
						</div>

						<div className="group hover:bg-stone-gray-light/20 rounded-lg p-4 -m-4 transition-all duration-300">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-wood-brown/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-wood-brown/20 transition-colors duration-300">
									<span className="text-lg">🎓</span>
								</div>
								<div className="flex-1">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
										<h3 className="font-heading text-lg text-deep-charcoal">
											<span className="text-moss-green font-medium">University</span> (2022 - 2023)
										</h3>
										<span className="text-sm text-charcoal-soft">Research Assistant, [Location]</span>
									</div>
									<p className="text-charcoal-soft text-sm leading-relaxed">Machine learning research, published papers, contributed to open-source projects</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Current Focus */}
				<section className="mb-16 fade-in-section">
					<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal mb-6">What I'm building</h2>

					<div className="bg-stone-gray-light/30 rounded-lg p-6 border border-stone-gray/20 hover:border-moss-green/30 transition-all duration-300 hover:shadow-lg">
						<div className="flex items-start gap-4">
							<div className="w-3 h-3 bg-moss-green rounded-full flex-shrink-0 mt-2 animate-gentle-pulse"></div>
							<div>
								<p className="text-charcoal-soft leading-relaxed mb-4">
									Currently working on <span className="text-moss-green font-medium">NextProject</span> - a minimalist tool for developers who value intentional design.
								</p>
								<p className="text-sm text-charcoal-soft">→ Launching in Q2 2024 • Built with Next.js, TypeScript, and careful attention to detail</p>
							</div>
						</div>
					</div>
				</section>

				{/* Skills */}
				<section className="mb-16 fade-in-section">
					<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal mb-6">Technologies</h2>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{["React/Next.js", "TypeScript", "Node.js", "Python", "PostgreSQL", "Design Systems", "Architecture", "DevOps"].map((tech, index) => (
							<div key={tech} className="group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
								<div className="text-sm text-moss-green font-medium tracking-wide mb-1 group-hover:text-moss-green-light transition-colors duration-300">{tech}</div>
								<div className="w-full h-px bg-stone-gray group-hover:bg-moss-green transition-all duration-300 transform group-hover:scale-x-110 origin-left"></div>
							</div>
						))}
					</div>
				</section>

				{/* Connect */}
				<section className="mb-16 fade-in-section">
					<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal mb-6">Connect</h2>

					<div className="flex flex-wrap gap-6">
						<a href="mailto:your@email.com" className="text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium hover:-translate-y-0.5">
							email
						</a>
						<a href="https://linkedin.com/in/yourprofile" className="text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium hover:-translate-y-0.5">
							linkedin
						</a>
						<a href="https://github.com/yourusername" className="text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium hover:-translate-y-0.5">
							github
						</a>
						<a href="https://twitter.com/yourusername" className="text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium hover:-translate-y-0.5">
							twitter
						</a>
						<a href="/resume.pdf" className="text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium hover:-translate-y-0.5">
							resume
						</a>
						<a href="/test" className="text-moss-green hover:text-deep-charcoal transition-all duration-300 font-medium hover:-translate-y-0.5">
							three.js demo
						</a>
					</div>
				</section>

				{/* Footer */}
				<footer className="border-t border-stone-gray/20 pt-8 fade-in-section">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="text-sm text-charcoal-soft">2024 © David Daniliuc</div>
						<div className="text-xs text-charcoal-soft italic">
							"Every line of code, a careful branch" <span className="animate-gentle-float inline-block">🌿</span>
						</div>
					</div>
				</footer>
			</main>
		</div>
	);
}
