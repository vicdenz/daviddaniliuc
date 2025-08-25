import PageCanvas from "@/components/PageCanvas";

export default function TestPage() {
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
				<main className="max-w-4xl bg-rice-paper mx-auto p-8 my-16 md:my-24 rounded-xl">
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
				</main>
			</div>
		</PageCanvas>
	);
}
