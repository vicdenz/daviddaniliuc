import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		"/api/audio/*": ["./private/audio/*.mp3"],
	},
	webpack: (config) => {
		config.module.rules.push({
			test: /\.(vert|frag)$/,
			use: ["raw-loader"],
		});
		return config;
	},
};

export default nextConfig;
