import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
	variable: "--font-ibm-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
	display: "swap",
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
			<body className={`${dmSans.variable} ${ibmPlexMono.variable} antialiased`}>{children}</body>
		</html>
	);
}
