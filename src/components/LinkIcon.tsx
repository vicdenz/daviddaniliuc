type LinkIconName = "github" | "linkedin" | "twitter" | "email" | "external";

const iconPaths: Record<Exclude<LinkIconName, "external" | "email">, string> = {
	github: "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.61.07-.61 1 .07 1.52 1.02 1.52 1.02.89 1.52 2.33 1.08 2.9.82.09-.64.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 6.45c.85 0 1.7.11 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.91.68 1.84v2.73c0 .26.18.57.69.48A10 10 0 0 0 12 2Z",
	linkedin: "M5.37 3.35A2.37 2.37 0 1 1 5.32 8a2.37 2.37 0 0 1 .05-4.65ZM3.25 9.83h4.19v10.92H3.25V9.83Zm6.82 0h4.02v1.49h.06c.56-1.06 1.93-2.18 3.97-2.18 4.25 0 5.04 2.8 5.04 6.44v5.17h-4.19v-4.58c0-1.09-.02-2.5-1.52-2.5-1.53 0-1.77 1.19-1.77 2.42v4.66h-4.19V9.83Z",
	twitter: "M18.9 2.5h3.68l-8.04 9.19L24 21.5h-7.41l-5.8-7.59-6.65 7.59H.45l8.6-9.83L0 2.5h7.6l5.24 6.93L18.9 2.5Zm-1.29 17.02h2.04L6.49 4.38H4.3l13.31 15.14Z",
};

type LinkIconProps = {
	name: LinkIconName;
};

export default function LinkIcon({ name }: LinkIconProps) {
	if (name === "external") {
		return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" /></svg>;
	}
	if (name === "email") {
		return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3.5 6.5h17v11h-17zM4.5 7.5 12 13l7.5-5.5" /></svg>;
	}

	return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d={iconPaths[name]} /></svg>;
}
