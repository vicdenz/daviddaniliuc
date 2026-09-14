import Image from "next/image";
import type { CSSProperties } from "react";

import type { OrganizationEntry } from "@/content/portfolio";

import styles from "./Portfolio.module.css";

type ExperienceListProps = {
	entries: readonly OrganizationEntry[];
	label: string;
	reveal: string;
};

export default function ExperienceList({ entries, label, reveal }: ExperienceListProps) {
	return (
		<section className={`${styles.index} ${reveal}`} aria-label={label}>
			{entries.map((entry) => {
				const details = [entry.role, entry.period].filter(Boolean).join(" · ");

				return (
					<article className={`${styles.entry} ${styles.organizationEntry}`} key={entry.organization}>
						<div className={styles.entryCopy}>
							<a className={styles.organizationLogo} href={entry.href} target="_blank" rel="noreferrer" aria-label={`${entry.organization} website`} style={{ "--organization-logo-scale": entry.logoScale ?? 1 } as CSSProperties}>
								<Image src={entry.logo} alt="" aria-hidden="true" width={50} height={50} sizes="50px" draggable={false} />
							</a>
							<h2>
								<span className={styles.entryTitle}>{entry.organization}</span>
								{details && <span className={styles.entryMeta}><span className={styles.entryMetaSeparator}> · </span>{details}</span>}
							</h2>
							<p>{entry.description}</p>
						</div>
					</article>
				);
			})}
		</section>
	);
}
