import type { NextConfig } from "next";

const testPanelsEnabled = process.env.NEXT_PUBLIC_BACKDROP_TEST_CONTROLS === "true";

const nextConfig: NextConfig = {
	webpack: (config, { webpack }) => {
		config.module.rules.push({
			test: /\.(vert|frag)$/,
			use: ["raw-loader"],
		});
		// This harness contains backdrop, dither, and font-pairing test panels.
		// Ignore the whole boundary so its optional fonts and controls stay out of production.
		if (!testPanelsEnabled) {
			config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@\/components\/backdrop\/BackdropTestHarness$/ }));
		}
		return config;
	},
};

export default nextConfig;
