import type { NextConfig } from "next";

const testControlsEnabled = process.env.NEXT_PUBLIC_BACKDROP_TEST_CONTROLS === "true";

const nextConfig: NextConfig = {
	webpack: (config, { webpack }) => {
		config.module.rules.push({
			test: /\.(vert|frag)$/,
			use: ["raw-loader"],
		});
		if (!testControlsEnabled) {
			config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@\/components\/backdrop\/BackdropTestHarness$/ }));
		}
		return config;
	},
};

export default nextConfig;
