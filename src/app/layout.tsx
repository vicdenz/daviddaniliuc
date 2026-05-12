import type { Metadata } from "next";
import { Funnel_Sans, Funnel_Display } from "next/font/google";
import "./globals.css";
import "../lib/fontawesome";

const funnelSans = Funnel_Sans({
	variable: "--font-funnel-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800"],
});

const funnelDisplay = Funnel_Display({
	variable: "--font-funnel-display",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
	title: "David Daniliuc",
	description: "David Daniliuc, infrastructure engineering intern @ Shopify and cs & math student @ UofT.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${funnelSans.variable} ${funnelDisplay.variable} antialiased`}>{children}</body>
		</html>
	);
}
