"use client";

import PageCanvas from "@/components/PageCanvas";

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
		<PageCanvas>
			<div className="min-h-screen text-deep-charcoal">
				{/* Main Content */}
				<main className="max-w-2xl bg-rice-paper mx-auto p-8 my-16 md:my-24 rounded-xl">
					{/* Header */}
					<section className="mb-16 fade-in-section">
						<h1 className="text-4xl md:text-5xl font-light text-deep-charcoal mb-8">david daniliuc</h1>

						<div className="space-y-1 text-lg text-charcoal-soft mb-8">
							<p>Full-Stack Developer & Designer</p>
							<p>Building elegant digital experiences</p>
						</div>

						<div className="flex flex-wrap gap-4 text-sm">
							<a href="/test" className="text-moss-green hover:text-deep-charcoal transition-colors underline underline-offset-4">
								three.js demo
							</a>
							<a href="mailto:david@example.com" className="text-moss-green hover:text-deep-charcoal transition-colors underline underline-offset-4">
								email
							</a>
							<a href="#" className="text-moss-green hover:text-deep-charcoal transition-colors underline underline-offset-4">
								resume
							</a>
							<a href="#" className="text-moss-green hover:text-deep-charcoal transition-colors underline underline-offset-4">
								github
							</a>
						</div>
					</section>

					{/* What I've Been Building */}
					<section className="mb-16 fade-in-section">
						<h2 className="text-xl text-deep-charcoal mb-6">what i've been building:</h2>

						<div className="space-y-3 text-charcoal-soft">
							<div className="flex items-start gap-2">
								<span className="text-moss-green mt-1">↳</span>
								<p>created modern e-commerce platform with React & TypeScript (10,000+ users)</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-moss-green mt-1">↳</span>
								<p>shipped responsive dashboard with real-time analytics in &lt; 3 days</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-moss-green mt-1">↳</span>
								<p>built interactive Three.js experiences with WebGL shaders</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-moss-green mt-1">↳</span>
								<p>developed full-stack applications with Node.js & AWS infrastructure</p>
							</div>
						</div>
					</section>

					{/* Previously */}
					<section className="mb-16 fade-in-section">
						<h2 className="text-xl text-deep-charcoal mb-6">previously:</h2>

						<div className="space-y-3 text-charcoal-soft">
							<div className="flex items-start gap-2">
								<span className="text-clay-red mt-1">↳</span>
								<p>Senior Full-Stack Developer @ Tech Startup Inc.</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-clay-red mt-1">↳</span>
								<p>Frontend Developer @ Digital Agency Co.</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-clay-red mt-1">↳</span>
								<p>Junior Developer @ Software Solutions Ltd.</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-clay-red mt-1">↳</span>
								<p>freelance web development & UI/UX design</p>
							</div>
						</div>
					</section>

					{/* Tech Stack */}
					<section className="mb-16 fade-in-section">
						<h2 className="text-xl text-deep-charcoal mb-6">tech stack:</h2>

						<div className="grid md:grid-cols-3 gap-8">
							<div>
								<h3 className="text-moss-green font-medium mb-3">Frontend</h3>
								<div className="space-y-1 text-sm text-charcoal-soft">
									<p>React / Next.js</p>
									<p>TypeScript</p>
									<p>Tailwind CSS</p>
									<p>Three.js / WebGL</p>
								</div>
							</div>

							<div>
								<h3 className="text-clay-red font-medium mb-3">Backend</h3>
								<div className="space-y-1 text-sm text-charcoal-soft">
									<p>Node.js / Express</p>
									<p>Python / FastAPI</p>
									<p>PostgreSQL / MongoDB</p>
									<p>AWS / Docker</p>
								</div>
							</div>

							<div>
								<h3 className="text-wood-brown font-medium mb-3">Design</h3>
								<div className="space-y-1 text-sm text-charcoal-soft">
									<p>Figma / Adobe CC</p>
									<p>UI/UX Design</p>
									<p>Brand Identity</p>
									<p>3D Modeling</p>
								</div>
							</div>
						</div>
					</section>

					{/* Call to Action */}
					<section className="mb-16 fade-in-section">
						<div className="border border-stone-gray/20 rounded-lg p-8 text-center">
							<p className="text-lg text-charcoal-soft mb-6">interested in working together?</p>
							<div className="flex flex-wrap justify-center gap-4">
								<a href="mailto:david@example.com" className="px-6 py-3 bg-moss-green text-washed-white rounded-lg hover:bg-moss-green/90 transition-colors">
									get in touch
								</a>
								<a href="#" className="px-6 py-3 border border-stone-gray text-deep-charcoal rounded-lg hover:bg-stone-gray/10 transition-colors">
									view resume
								</a>
							</div>
						</div>
					</section>

					{/* Footer */}
					<footer className="border-t border-stone-gray/20 pt-8 fade-in-section">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-charcoal-soft">
							<div>2024 © David Daniliuc</div>
							<div className="flex items-center gap-2 italic">
								<span className="animate-gentle-float">🌿</span>
								"crafting digital experiences"
							</div>
						</div>
					</footer>
				</main>
			</div>
		</PageCanvas>
	);
}
