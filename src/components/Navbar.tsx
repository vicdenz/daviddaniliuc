import React from "react";

export default function Navbar() {
	return (
		<header className="sticky top-0 z-50 bg-washed-white">
			<div className="max-w-6xl mx-auto px-6 py-4">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					{/* Name */}
					<div>
						<h1 className="text-2xl lg:text-3xl font-light text-deep-charcoal">david daniliuc</h1>
						<p className="text-sm text-charcoal-soft">Full-Stack Developer & Designer</p>
					</div>

					{/* Navigation Links */}
					<nav className="flex flex-wrap gap-6 text-sm">
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
					</nav>
				</div>
			</div>
		</header>
	);
}
