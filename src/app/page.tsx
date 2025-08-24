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

	// Color palette data defined directly in component
	const colorPalette = {
		washedWhite: "#FAF9F6",
		stoneGray: "#D4D0C6",
		stoneGrayLight: "#E8E6E1",
		deepCharcoal: "#2C2C2C",
		charcoalSoft: "#4A4A4A",
		mossGreen: "#6E7C60",
		mossGreenLight: "#8A9B7A",
		clayRed: "#A05C4E",
		clayRedSoft: "#B87265",
		woodBrown: "#8B6C42",
		woodBrownLight: "#A08156",
		ricePaper: "#F7F4F0",
		scrollBeige: "#F0ECE5",
		inkWash: "#E8E3DA",
		bambooMist: "#E5E8E0",
		teaStain: "#F2EDE4",
	};

	const colorCategories = [
		{
			name: "Primary Colors",
			colors: [
				{ name: "Washed White", key: "washedWhite", description: "Clean, minimal background" },
				{ name: "Deep Charcoal", key: "deepCharcoal", description: "Strong text and accents" },
				{ name: "Moss Green", key: "mossGreen", description: "Natural, calming primary" },
			],
		},
		{
			name: "Secondary Colors",
			colors: [
				{ name: "Stone Gray", key: "stoneGray", description: "Subtle background element" },
				{ name: "Stone Gray Light", key: "stoneGrayLight", description: "Subtle borders" },
				{ name: "Charcoal Soft", key: "charcoalSoft", description: "Secondary text" },
				{ name: "Moss Green Light", key: "mossGreenLight", description: "Hover states" },
			],
		},
		{
			name: "Supporting Colors",
			colors: [
				{ name: "Rice Paper", key: "ricePaper", description: "Traditional paper texture background" },
				{ name: "Scroll Beige", key: "scrollBeige", description: "Aged parchment tone" },
				{ name: "Ink Wash", key: "inkWash", description: "Diluted ink effect" },
				{ name: "Bamboo Mist", key: "bambooMist", description: "Soft natural haze" },
				{ name: "Tea Stain", key: "teaStain", description: "Warm vintage patina" },
			],
		},
	];

	return (
		<PageCanvas>
			<div className="min-h-screen text-deep-charcoal">
				{/* Main Content */}
				<main className="max-w-4xl bg-washed-white mx-auto px-6 py-16 md:py-24">
					{/* Color Palette Showcase Section */}
					<header className="mb-20 animate-fade-in-up text-center">
						<div className="inline-flex items-center gap-3 mb-6">
							<div className="w-8 h-8 rounded-full bg-moss-green animate-gentle-pulse"></div>
							<h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-deep-charcoal leading-tight">
								<span className="italic text-moss-green">bonsai</span> palette
							</h1>
							<div className="w-8 h-8 rounded-full bg-clay-red animate-gentle-pulse"></div>
						</div>

						<p className="text-xl md:text-2xl text-charcoal-soft leading-relaxed font-light max-w-2xl mx-auto animate-fade-in-up delay-200">A thoughtfully curated color system inspired by the tranquil beauty of Japanese gardens</p>

						<div className="w-32 h-px bg-stone-gray mx-auto mt-8 animate-fade-in delay-300"></div>

						<div className="flex justify-center items-center gap-2 mt-8 animate-fade-in-up delay-400">
							{Object.entries(colorPalette).map(([key, color], index) => (
								<div key={key} className="w-4 h-4 rounded-full border border-stone-gray/30 hover:scale-125 transition-transform duration-300" style={{ backgroundColor: color, animationDelay: `${index * 0.05}s` }} title={key} />
							))}
						</div>
					</header>

					{/* Color Categories */}
					{colorCategories.map((category, categoryIndex) => (
						<section key={category.name} className="mb-16 fade-in-section">
							<div className="flex items-center gap-4 mb-8">
								<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal">{category.name}</h2>
								<div className="flex-1 h-px bg-stone-gray"></div>
							</div>

							<div className="grid gap-6">
								{category.colors.map((colorInfo, colorIndex) => {
									const hexValue = colorPalette[colorInfo.key as keyof typeof colorPalette];
									const cssVarName = colorInfo.key.replace(/([A-Z])/g, "-$1").toLowerCase();
									return (
										<div key={colorInfo.key} className="group bg-washed-white border border-stone-gray/20 rounded-lg p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${colorIndex * 0.1}s` }}>
											<div className="flex items-center gap-6">
												<div className="relative">
													<div className="w-20 h-20 rounded-lg border-2 border-stone-gray/30 shadow-inner group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: hexValue }} />
													<div className="absolute -bottom-2 -right-2 w-6 h-6 bg-washed-white rounded-full border border-stone-gray/30 flex items-center justify-center">
														<div className="w-3 h-3 rounded-full" style={{ backgroundColor: hexValue }} />
													</div>
												</div>

												<div className="flex-1">
													<h3 className="font-heading text-xl text-deep-charcoal mb-2 group-hover:text-moss-green transition-colors">{colorInfo.name}</h3>
													<p className="text-charcoal-soft mb-3 leading-relaxed">{colorInfo.description}</p>
													<div className="flex items-center gap-4 text-sm">
														<code className="bg-stone-gray-light px-3 py-1 rounded font-mono text-deep-charcoal">{hexValue}</code>
														<code className="bg-stone-gray-light px-3 py-1 rounded font-mono text-deep-charcoal">--{cssVarName}</code>
													</div>
												</div>

												<div className="hidden md:flex flex-col gap-2">
													<div className="w-24 h-3 rounded" style={{ backgroundColor: hexValue }} />
													<div className="w-16 h-2 rounded" style={{ backgroundColor: hexValue, opacity: 0.7 }} />
													<div className="w-20 h-2 rounded" style={{ backgroundColor: hexValue, opacity: 0.4 }} />
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</section>
					))}

					{/* Divider */}
					<div className="my-20 flex items-center justify-center fade-in-section">
						<div className="flex-1 h-px bg-stone-gray"></div>
						<div className="mx-8 text-charcoal-soft text-sm">•••</div>
						<div className="flex-1 h-px bg-stone-gray"></div>
					</div>

					{/* Developer Portfolio Section */}
					<section className="mb-20 fade-in-section">
						<div className="text-center mb-16">
							<h2 className="font-heading text-4xl md:text-5xl text-deep-charcoal mb-6">
								David <span className="italic text-moss-green">Daniliuc</span>
							</h2>
							<p className="text-xl text-charcoal-soft max-w-2xl mx-auto leading-relaxed">Full-Stack Developer & Designer crafting elegant digital experiences with modern technologies</p>
						</div>

						{/* Skills */}
						<div className="grid md:grid-cols-3 gap-8 mb-16">
							<div className="text-center p-6 border border-stone-gray/20 rounded-lg hover:shadow-lg transition-all duration-300">
								<div className="w-16 h-16 bg-moss-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl">⚡</span>
								</div>
								<h3 className="font-heading text-xl text-moss-green mb-3">Frontend</h3>
								<p className="text-charcoal-soft text-sm mb-4">Modern React ecosystem with TypeScript</p>
								<div className="flex flex-wrap gap-2 justify-center">
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">React</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Next.js</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">TypeScript</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Tailwind</span>
								</div>
							</div>

							<div className="text-center p-6 border border-stone-gray/20 rounded-lg hover:shadow-lg transition-all duration-300">
								<div className="w-16 h-16 bg-clay-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl">🔧</span>
								</div>
								<h3 className="font-heading text-xl text-clay-red mb-3">Backend</h3>
								<p className="text-charcoal-soft text-sm mb-4">Scalable APIs and cloud infrastructure</p>
								<div className="flex flex-wrap gap-2 justify-center">
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Node.js</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Python</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">AWS</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Docker</span>
								</div>
							</div>

							<div className="text-center p-6 border border-stone-gray/20 rounded-lg hover:shadow-lg transition-all duration-300">
								<div className="w-16 h-16 bg-wood-brown/10 rounded-full flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl">🎨</span>
								</div>
								<h3 className="font-heading text-xl text-wood-brown mb-3">Design</h3>
								<p className="text-charcoal-soft text-sm mb-4">User-centered design and creative solutions</p>
								<div className="flex flex-wrap gap-2 justify-center">
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Figma</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Three.js</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">UI/UX</span>
									<span className="px-3 py-1 bg-stone-gray-light rounded-full text-xs text-deep-charcoal">Branding</span>
								</div>
							</div>
						</div>
					</section>

					{/* Experience */}
					<section className="mb-20 fade-in-section">
						<h2 className="font-heading text-3xl text-deep-charcoal mb-12 text-center">Recent Experience</h2>

						<div className="space-y-8">
							<div className="border-l-2 border-moss-green pl-6 pb-8">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
									<h3 className="font-heading text-xl text-deep-charcoal">Senior Full-Stack Developer</h3>
									<span className="text-sm text-charcoal-soft">2022 - Present</span>
								</div>
								<p className="text-moss-green font-medium mb-2">Tech Startup Inc.</p>
								<p className="text-charcoal-soft leading-relaxed">Led development of modern web applications using React, TypeScript, and Node.js. Improved performance by 40% and reduced load times through optimization strategies.</p>
							</div>

							<div className="border-l-2 border-clay-red pl-6 pb-8">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
									<h3 className="font-heading text-xl text-deep-charcoal">Frontend Developer</h3>
									<span className="text-sm text-charcoal-soft">2020 - 2022</span>
								</div>
								<p className="text-clay-red font-medium mb-2">Digital Agency Co.</p>
								<p className="text-charcoal-soft leading-relaxed">Built responsive web applications and e-commerce platforms. Collaborated with design teams to create pixel-perfect user interfaces.</p>
							</div>

							<div className="border-l-2 border-wood-brown pl-6">
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
									<h3 className="font-heading text-xl text-deep-charcoal">Junior Developer</h3>
									<span className="text-sm text-charcoal-soft">2019 - 2020</span>
								</div>
								<p className="text-wood-brown font-medium mb-2">Software Solutions Ltd.</p>
								<p className="text-charcoal-soft leading-relaxed">Developed web applications and learned modern development practices. Contributed to multiple client projects and internal tools.</p>
							</div>
						</div>
					</section>

					{/* Projects */}
					<section className="mb-20 fade-in-section">
						<h2 className="font-heading text-3xl text-deep-charcoal mb-12 text-center">Featured Projects</h2>

						<div className="grid md:grid-cols-2 gap-8">
							<div className="group border border-stone-gray/20 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
								<div className="h-48 bg-gradient-to-br from-moss-green/20 to-moss-green/40 flex items-center justify-center">
									<span className="text-4xl">🌿</span>
								</div>
								<div className="p-6">
									<h3 className="font-heading text-xl text-deep-charcoal mb-3 group-hover:text-moss-green transition-colors">E-Commerce Platform</h3>
									<p className="text-charcoal-soft mb-4 leading-relaxed">Modern e-commerce solution with React, Stripe integration, and admin dashboard.</p>
									<div className="flex flex-wrap gap-2 mb-4">
										<span className="px-2 py-1 bg-moss-green/10 text-moss-green rounded text-xs">React</span>
										<span className="px-2 py-1 bg-moss-green/10 text-moss-green rounded text-xs">Node.js</span>
										<span className="px-2 py-1 bg-moss-green/10 text-moss-green rounded text-xs">Stripe</span>
									</div>
									<a href="#" className="text-clay-red hover:text-deep-charcoal transition-colors text-sm font-medium">
										View Project →
									</a>
								</div>
							</div>

							<div className="group border border-stone-gray/20 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
								<div className="h-48 bg-gradient-to-br from-clay-red/20 to-clay-red/40 flex items-center justify-center">
									<span className="text-4xl">📱</span>
								</div>
								<div className="p-6">
									<h3 className="font-heading text-xl text-deep-charcoal mb-3 group-hover:text-clay-red transition-colors">Mobile App Dashboard</h3>
									<p className="text-charcoal-soft mb-4 leading-relaxed">Analytics dashboard with real-time data visualization and responsive design.</p>
									<div className="flex flex-wrap gap-2 mb-4">
										<span className="px-2 py-1 bg-clay-red/10 text-clay-red rounded text-xs">Next.js</span>
										<span className="px-2 py-1 bg-clay-red/10 text-clay-red rounded text-xs">TypeScript</span>
										<span className="px-2 py-1 bg-clay-red/10 text-clay-red rounded text-xs">Chart.js</span>
									</div>
									<a href="#" className="text-clay-red hover:text-deep-charcoal transition-colors text-sm font-medium">
										View Project →
									</a>
								</div>
							</div>
						</div>
					</section>

					{/* Contact */}
					<section className="mb-16 fade-in-section">
						<div className="text-center">
							<h2 className="font-heading text-2xl md:text-3xl text-deep-charcoal mb-8">Let's Work Together</h2>

							<div className="flex flex-wrap justify-center gap-6">
								<a href="/test" className="group px-8 py-4 bg-moss-green text-washed-white rounded-lg font-medium tracking-wide hover:bg-moss-green-light transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
									Three.js Demo
									<span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
								</a>

								<a href="mailto:david@example.com" className="px-8 py-4 border-2 border-clay-red text-clay-red rounded-lg font-medium tracking-wide hover:bg-clay-red hover:text-washed-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
									Get In Touch
								</a>

								<a href="#" className="px-8 py-4 border-2 border-wood-brown text-wood-brown rounded-lg font-medium tracking-wide hover:bg-wood-brown hover:text-washed-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
									Download Resume
								</a>
							</div>
						</div>
					</section>

					{/* Footer */}
					<footer className="border-t border-stone-gray/20 pt-8 fade-in-section">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
							<div className="text-sm text-charcoal-soft">2024 © David Daniliuc</div>
							<div className="text-xs text-charcoal-soft italic flex items-center gap-2">
								<span className="animate-gentle-float">🌿</span>
								"Every color tells a story"
							</div>
						</div>
					</footer>
				</main>
			</div>
		</PageCanvas>
	);
}
