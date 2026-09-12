import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { FiExternalLink } from "react-icons/fi";

const icons = {
	github: FaGithub,
	linkedin: FaLinkedin,
	twitter: FaXTwitter,
	external: FiExternalLink,
};

type LinkIconProps = {
	name: keyof typeof icons;
};

export default function LinkIcon({ name }: LinkIconProps) {
	const Icon = icons[name];
	return <Icon aria-hidden="true" focusable="false" />;
}
