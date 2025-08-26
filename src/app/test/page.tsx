"use client";

import PageCanvas from "@/components/PageCanvas";
import Card from "@/components/Card";
import Navbar from "@/components/Navbar";
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
				<Navbar />

				{/* Main Content */}
				<main className="max-w-6xl mx-auto px-6 py-12">
					{/* Hero Section */}
					<section className="mb-16 text-center">
						<Card size="full" className="max-w-4xl mx-auto">
							<h2 className="text-3xl lg:text-4xl font-light text-deep-charcoal mb-6">Building elegant digital experiences</h2>
							<p className="text-lg text-charcoal-soft max-w-2xl mx-auto leading-relaxed">Passionate about creating modern web applications with clean code, beautiful design, and seamless user experiences using cutting-edge technologies.</p>
						</Card>
					</section>

					{/* Two Column Layout */}
					<div className="grid lg:grid-cols-2 gap-8 mb-16">
						{/* Left Column */}
						<div className="space-y-8">
							{/* What I've Been Building */}
							<Card size="large">
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
							</Card>

							{/* Tech Stack */}
							<Card size="large">
								<h2 className="text-xl text-deep-charcoal mb-6">tech stack:</h2>
								<div className="grid gap-6">
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
							</Card>
						</div>

						{/* Right Column */}
						<div className="space-y-8">
							{/* Previously */}
							<Card size="large">
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
							</Card>

							{/* Call to Action */}
							<Card size="large" className="text-center">
								<h2 className="text-xl text-deep-charcoal mb-4">interested in working together?</h2>
								<p className="text-charcoal-soft mb-6">Let's create something amazing together. I'm always excited to work on new projects and collaborate with fellow developers and designers.</p>
								<div className="flex flex-wrap justify-center gap-4">
									<a href="mailto:david@example.com" className="px-6 py-3 bg-moss-green text-washed-white rounded-lg hover:bg-moss-green/90 transition-colors">
										get in touch
									</a>
									<a href="#" className="px-6 py-3 border border-stone-gray text-deep-charcoal rounded-lg hover:bg-stone-gray/10 transition-colors">
										view resume
									</a>
								</div>
							</Card>

							{/* Featured Project */}
							<Card size="large">
								<h2 className="text-xl text-deep-charcoal mb-4">featured project:</h2>
								<div className="space-y-4">
									<div className="aspect-video bg-gradient-to-br from-moss-green/20 to-moss-green/40 rounded-lg flex items-center justify-center">
										<span className="text-2xl">🌿</span>
									</div>
									<div>
										<h3 className="text-lg font-medium text-deep-charcoal mb-2">Interactive Portfolio</h3>
										<p className="text-sm text-charcoal-soft mb-3">Personal portfolio with Three.js animations, WebGL shaders, and responsive design.</p>
										<div className="flex flex-wrap gap-2">
											<span className="px-2 py-1 bg-moss-green/10 text-moss-green rounded text-xs">Next.js</span>
											<span className="px-2 py-1 bg-moss-green/10 text-moss-green rounded text-xs">Three.js</span>
											<span className="px-2 py-1 bg-moss-green/10 text-moss-green rounded text-xs">WebGL</span>
										</div>
									</div>
								</div>
							</Card>
						</div>
					</div>

					{/* Footer */}
					<footer className="border-t border-stone-gray/20 pt-8">
						<Card size="medium" className="text-center">
							<div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-charcoal-soft">
								<div>2024 © David Daniliuc</div>
								<div className="flex items-center gap-2 italic">
									<span className="animate-gentle-float">🌿</span>
									"crafting digital experiences"
								</div>
							</div>
						</Card>
					</footer>
				</main>
			</div>
		</PageCanvas>
	);
}
