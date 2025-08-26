import PageCanvas from "@/components/PageCanvas";
import Navbar from "@/components/Navbar";

export default function TestPage() {
	return (
		<PageCanvas>
			<div className="min-h-screen text-deep-charcoal">
				<Navbar />
				{/* Main Content */}
				<main className="max-w-4xl bg-rice-paper mx-auto my-24 py-6 px-8 rounded-xl">
					{/* Color Palette Showcase Section */}
					<header className="mb-20 animate-fade-in-up text-center">
						<div className="inline-flex items-center gap-3 mb-6">
							<h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-deep-charcoal font-bold">David Daniliuc</h1>
						</div>

						<p className="text-xl md:text-2xl text-charcoal-soft leading-relaxed font-light max-w-2xl mx-auto animate-fade-in-up delay-200">A thoughtfully curated color system inspired by the tranquil beauty of Japanese gardens</p>
					</header>
				</main>
			</div>
		</PageCanvas>
	);
}
