import styles from "./Portfolio.module.css";

type SectionDividerProps = {
	delay?: "initial" | "late" | "last";
	label: string;
};

export default function SectionDivider({ delay = "initial", label }: SectionDividerProps) {
	const delayClass = delay === "late"
		? styles.sectionDividerLate
		: delay === "last"
			? styles.sectionDividerLast
			: "";

	return (
		<div className={`${styles.sectionDivider} ${delayClass}`} role="separator">
			<span className={styles.sectionDividerLabel}><span className={styles.sectionDividerLabelText}>{label}</span></span>
			<span className={`${styles.sectionDividerRule} section-divider`} />
		</div>
	);
}
