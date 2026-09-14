import type { Metadata } from "next";

import PageCanvas from "@/components/PageCanvas";
import SiteFooter from "@/components/SiteFooter";

import "./globals.css";

export const metadata: Metadata = {
	title: "David Daniliuc",
	description: "David Daniliuc, prev. swe @ Shopify and cs & math student @ UofT.",
	icons: {
		icon: [{ url: "/david-logo.png", type: "image/png", sizes: "1024x1024" }],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<PageCanvas>
					{children}
					<SiteFooter />
				</PageCanvas>
			</body>
		</html>
	);
}
