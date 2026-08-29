"use client";

import { useEffect, useState } from "react";
import { Archivo, DM_Sans, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Sans, Manrope, Newsreader, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import typographyStyles from "@/components/TypographyControls.module.css";

const archivo = Archivo({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", preload: false });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", preload: false });
const instrumentSans = Instrument_Sans({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: "variable", display: "swap", preload: false });

type FontOption = {
	id: string;
	label: string;
	stack: string;
	commercial?: boolean;
};

const sansStack = (family: string) => `${family}, sans-serif`;
const serifStack = (family: string) => `${family}, serif`;
const monoStack = (family: string) => `${family}, monospace`;

const FONT_OPTIONS: FontOption[] = [
	{ id: "geist", label: "Geist", stack: "var(--font-geist-sans), sans-serif" },
	{ id: "ibm-plex-sans", label: "IBM Plex Sans", stack: sansStack(ibmPlexSans.style.fontFamily) },
	{ id: "instrument-sans", label: "Instrument Sans", stack: sansStack(instrumentSans.style.fontFamily) },
	{ id: "archivo", label: "Archivo", stack: sansStack(archivo.style.fontFamily) },
	{ id: "source-sans-3", label: "Source Sans 3", stack: sansStack(sourceSans.style.fontFamily) },
	{ id: "newsreader", label: "Newsreader", stack: serifStack(newsreader.style.fontFamily) },
	{ id: "neue-montreal", label: "Neue Montreal", stack: '"Neue Montreal", var(--font-geist-sans), sans-serif', commercial: true },
	{ id: "source-serif-4", label: "Source Serif 4", stack: serifStack(sourceSerif.style.fontFamily) },
	{ id: "manrope", label: "Manrope", stack: sansStack(manrope.style.fontFamily) },
	{ id: "dm-sans", label: "DM Sans", stack: sansStack(dmSans.style.fontFamily) },
	{ id: "geist-mono", label: "Geist Mono", stack: "var(--font-geist-mono), monospace" },
	{ id: "ibm-plex-mono", label: "IBM Plex Mono", stack: monoStack(ibmPlexMono.style.fontFamily) },
	{ id: "sohne", label: "Söhne", stack: '"Söhne", var(--font-geist-sans), sans-serif', commercial: true },
	{ id: "sohne-mono", label: "Söhne Mono", stack: '"Söhne Mono", var(--font-geist-mono), monospace', commercial: true },
];

const DEFAULT_PRIMARY = "geist";
const DEFAULT_SECONDARY = "ibm-plex-sans";
const STORAGE_KEY = "font-pairing-test-v2";

type StoredTypography = { primaryId: string; secondaryId: string };

const validFontId = (id: unknown): id is string => typeof id === "string" && FONT_OPTIONS.some((font) => font.id === id);

const loadTypography = (): StoredTypography => {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<StoredTypography> | null;
		return {
			primaryId: validFontId(stored?.primaryId) ? stored.primaryId : DEFAULT_PRIMARY,
			secondaryId: validFontId(stored?.secondaryId) ? stored.secondaryId : DEFAULT_SECONDARY,
		};
	} catch {
		return { primaryId: DEFAULT_PRIMARY, secondaryId: DEFAULT_SECONDARY };
	}
};

const fontOption = (id: string) => FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];

export default function TypographyControls() {
	const [primaryId, setPrimaryId] = useState(DEFAULT_PRIMARY);
	const [secondaryId, setSecondaryId] = useState(DEFAULT_SECONDARY);
	const [settingsLoaded, setSettingsLoaded] = useState(false);

	useEffect(() => {
		const stored = loadTypography();
		setPrimaryId(stored.primaryId);
		setSecondaryId(stored.secondaryId);
		setSettingsLoaded(true);
	}, []);

	useEffect(() => {
		if (!settingsLoaded) return;
		const page = document.body;
		page.style.setProperty("--sans", fontOption(primaryId).stack);
		page.style.setProperty("--mono", fontOption(secondaryId).stack);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ primaryId, secondaryId }));
		} catch {
			// Storage can be unavailable in privacy-restricted browsing contexts.
		}
	}, [primaryId, secondaryId, settingsLoaded]);

	useEffect(() => () => {
		document.body.style.removeProperty("--sans");
		document.body.style.removeProperty("--mono");
	}, []);

	const reset = () => {
		setPrimaryId(DEFAULT_PRIMARY);
		setSecondaryId(DEFAULT_SECONDARY);
	};

	const renderOptions = () => FONT_OPTIONS.map(({ id, label, commercial }) => <option key={id} value={id}>{label}{commercial ? " · local" : ""}</option>);

	return (
		<details className={typographyStyles.panel} open>
			<summary><span>Font pairings</span><small>Independent roles</small></summary>
			<div className={typographyStyles.body}>
				<label className={typographyStyles.pairing}>
					<span>First font — primary text</span>
					<select value={primaryId} onChange={(event) => setPrimaryId(event.target.value)}>{renderOptions()}</select>
				</label>
				<label className={typographyStyles.pairing}>
					<span>Second font — metadata</span>
					<select value={secondaryId} onChange={(event) => setSecondaryId(event.target.value)}>{renderOptions()}</select>
				</label>
				<p className={typographyStyles.note}>“Local” families require an installed licensed copy; Geist is their fallback.</p>
				<button className={typographyStyles.reset} type="button" onClick={reset}>Reset to Geist + IBM Plex Sans</button>
			</div>
		</details>
	);
}
