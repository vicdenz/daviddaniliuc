import Link from "next/link";

import LinkIcon from "@/components/LinkIcon";

export default function SiteFooter() {
	return (
		<footer className="site-footer reveal reveal-from-bottom reveal-offset-12 reveal-500">
			<nav className="site-footer-pages" aria-label="Pages">
				<Link href="/">home</Link>
				<Link href="/music">music</Link>
				<Link href="/resume">resume</Link>
			</nav>
			<div className="site-footer-links">
				<a href="https://github.com/vicdenz/" target="_blank" rel="noreferrer"><LinkIcon name="github" />GitHub</a>
				<a href="https://www.linkedin.com/in/david-daniliuc/" target="_blank" rel="noreferrer"><LinkIcon name="linkedin" />LinkedIn</a>
				<a href="https://x.com/daviddaniliuc_" target="_blank" rel="noreferrer"><LinkIcon name="twitter" />Twitter</a>
			</div>
		</footer>
	);
}
