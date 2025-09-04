import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface ContactButtonProps {
	icon: IconDefinition;
	text?: string;
	href: string;
}

export default function ContactButton({ icon, text, href }: ContactButtonProps) {
	const baseClasses = "px-4 py-2 rounded-lg font-display transition-colors flex items-center gap-2";
	const primaryClasses = "bg-moss-green text-white hover:bg-moss-green-light";
	const secondaryClasses = "border border-stone-gray text-stone-gray hover:bg-stone-gray-light hover:text-white";

	return (
		<a href={href} className="px-4 py-2 rounded-lg font-display transition-colors flex items-center gap-2 border border-stone-gray text-stone-gray hover:bg-moss-green-light hover:border-moss-green-light">
			<FontAwesomeIcon icon={icon} size="2xl" />
			{text && text}
		</a>
	);
}
