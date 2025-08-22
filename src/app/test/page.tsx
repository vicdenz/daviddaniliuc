import PageWithBackground from "@/components/PageWithBackground";

export default function TestPage() {
	return (
		<PageWithBackground>
			<main className="flex items-center justify-center min-h-screen px-6">
				<div className="text-center">
					<h1 className="font-heading text-6xl md:text-8xl text-deep-charcoal mb-8">Test</h1>
					<p className="text-lg md:text-xl text-charcoal-soft max-w-md">This page showcases the Three.js background component with shader-based animations.</p>

					<div className="mt-8">
						<a href="/" className="inline-flex items-center text-clay-red hover:text-deep-charcoal transition-all duration-300 font-medium group">
							← Back to Home
							<span className="ml-2 transition-transform group-hover:-translate-x-1">🏠</span>
						</a>
					</div>
				</div>
			</main>
		</PageWithBackground>
	);
}
