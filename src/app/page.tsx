import PageCanvas from "@/components/PageCanvas";

export default function Home() {
	return (
		<PageCanvas>
			{/* Fixed Left Sidebar */}
			<aside className="fixed bottom-0 p-8 mb-8">
				<div className="animate-fade-in-up">
					<div className="mb-4">
						<h1 className="font-heading text-4xl text-stone-gray-light font-bold">david daniliuc</h1>
					</div>
					<ul className="space-y-3">
						<li className="flex items-center gap-3 animate-fade-in-left delay-300">
							<svg className="w-4 h-4 text-stone-gray flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2 C12 6 16 12 22 12 C16 12 12 18 12 22 C12 18 8 12 2 12 C8 12 12 6 12 2 Z" />
							</svg>
							<p className="font-display text-lg text-stone-gray leading-relaxed font-light">cloudops engineer @ MPAC</p>
						</li>
						<li className="flex items-center gap-3 animate-fade-in-left delay-500">
							<svg className="w-4 h-4 text-stone-gray flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2 C12 6 16 12 22 12 C16 12 12 18 12 22 C12 18 8 12 2 12 C8 12 12 6 12 2 Z" />
							</svg>
							<p className="font-display text-lg text-stone-gray leading-relaxed font-light">computer science @ UofT - St. George</p>
						</li>
					</ul>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className="flex-1 ml-96 p-8">
				{/* Projects Section */}
				<section className="mb-16 animate-fade-in-up delay-200">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold mb-8">Projects</h2>
					<div className="space-y-8">
						<div className="border border-stone-gray-light rounded-lg p-6 animate-fade-in-left delay-400">
							<h3 className="font-display text-xl text-stone-gray font-semibold mb-3">Portfolio Website</h3>
							<p className="font-display text-stone-gray leading-relaxed mb-4">A modern portfolio built with Next.js, Three.js, and custom GLSL shaders. Features dynamic background animations and responsive design.</p>
							<div className="flex flex-wrap gap-2">
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">Next.js</span>
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">Three.js</span>
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">GLSL</span>
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">TypeScript</span>
							</div>
						</div>

						<div className="border border-stone-gray-light rounded-lg p-6 animate-fade-in-left delay-600">
							<h3 className="font-display text-xl text-stone-gray font-semibold mb-3">CloudOps Infrastructure</h3>
							<p className="font-display text-stone-gray leading-relaxed mb-4">Designed and implemented scalable cloud infrastructure solutions for municipal property assessment systems.</p>
							<div className="flex flex-wrap gap-2">
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">AWS</span>
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">Docker</span>
								<span className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">Kubernetes</span>
							</div>
						</div>
					</div>
				</section>

				{/* About Section */}
				<section className="mb-16 animate-fade-in-up delay-800">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold mb-8">About Me</h2>
					<div className="border border-stone-gray-light rounded-lg p-6">
						<p className="font-display text-stone-gray leading-relaxed mb-4">I'm a Computer Science student at the University of Toronto with a passion for cloud infrastructure and modern web technologies. Currently working as a CloudOps Engineer at MPAC, where I help build and maintain scalable systems for property assessment.</p>
						<p className="font-display text-stone-gray leading-relaxed mb-4">When I'm not coding, you can find me exploring new technologies, contributing to open source projects, or experimenting with creative coding and shaders.</p>
						<p className="font-display text-stone-gray leading-relaxed">I enjoy working at the intersection of performance, design, and user experience to create meaningful digital experiences.</p>
					</div>
				</section>

				{/* Contact Section */}
				<section className="animate-fade-in-up delay-1000">
					<h2 className="font-heading text-3xl text-stone-gray-light font-bold mb-8">Get In Touch</h2>
					<div className="border border-stone-gray-light rounded-lg p-6">
						<p className="font-display text-stone-gray leading-relaxed mb-6">I'm always interested in new opportunities and interesting projects. Feel free to reach out!</p>
						<div className="flex gap-4">
							<a href="mailto:your.email@example.com" className="px-6 py-3 bg-moss-green text-white rounded-lg font-display hover:bg-moss-green-light transition-colors">
								Email Me
							</a>
							<a href="#" className="px-6 py-3 border border-stone-gray text-stone-gray rounded-lg font-display hover:bg-stone-gray-light hover:text-white transition-colors">
								LinkedIn
							</a>
							<a href="#" className="px-6 py-3 border border-stone-gray text-stone-gray rounded-lg font-display hover:bg-stone-gray-light hover:text-white transition-colors">
								GitHub
							</a>
						</div>
					</div>
				</section>
			</main>
		</PageCanvas>
	);
}
