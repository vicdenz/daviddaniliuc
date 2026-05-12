interface ProjectCardProps {
	title: string;
	description: string;
	technologies: string[];
	href?: string;
	className?: string;
}

export default function ProjectCard({ title, description, technologies, href, className = "" }: ProjectCardProps) {
	return (
		<div className={className}>
			<h3 className="font-display text-xl text-stone-gray font-semibold pb-1">
				{href ? (
					<a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-moss-green-light transition-colors underline underline-offset-4">{title}</a>
				) : title}
			</h3>
			<p className="font-display text-stone-gray leading-relaxed mb-4">{description}</p>
			<div className="flex flex-wrap gap-2">
				{technologies.map((tech, index) => (
					<span key={index} className="px-3 py-1 bg-moss-green text-white text-sm rounded-full">
						{tech}
					</span>
				))}
			</div>
		</div>
	);
}
