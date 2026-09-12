import Image from "next/image";
import type { CSSProperties } from "react";

import type { OrganizationEntry } from "@/content/portfolio";

import styles from "./Journal.module.css";

type ExperienceListProps = {
	entries: readonly OrganizationEntry[];
	label: string;
	reveal: string;
};

export default function ExperienceList({ entries, label, reveal }: ExperienceListProps) {
	return (
		<section className={`${styles.index} ${reveal}`} aria-label={label}>
			{entries.map((entry) => (
				<article className={`${styles.entry} ${styles.organizationEntry}`} key={entry.organization}>
					<div className={styles.entryCopy}>
						<div className={styles.organizationHeader}>
							<a className={styles.organizationLogo} href={entry.href} target="_blank" rel="noreferrer" aria-label={`${entry.organization} website`} style={{ "--organization-logo-scale": entry.logoScale ?? 1 } as CSSProperties}>
								<Image src={entry.logo} alt="" aria-hidden="true" width={50} height={50} sizes="50px" draggable={false} />
							</a>
							<h2>{entry.organization} <span className={styles.entryMeta}>· {entry.role}{entry.period ? ` · ${entry.period}` : ""}</span></h2>
						</div>
						<p>{entry.description}</p>
					</div>
				</article>
			))}
		</section>
	);
}
