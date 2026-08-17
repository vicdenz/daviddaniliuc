"use client";

import { useEffect, useRef } from "react";

type Route = {
	axis: "x" | "y";
	position: number;
	speed: number;
	offset: number;
	length: number;
};

function seededRandom(seed: number) {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export default function InfrastructureBackdrop() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const context = canvas.getContext("2d");
		if (!context) return;

		let width = window.innerWidth;
		let height = window.innerHeight;
		let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
		let animationFrame = 0;
		let routes: Route[] = [];
		const pointer = { x: 0.5, y: 0.5 };
		const easedPointer = { x: 0.5, y: 0.5 };
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const noiseCanvas = document.createElement("canvas");
		noiseCanvas.width = 140;
		noiseCanvas.height = 140;
		const noiseContext = noiseCanvas.getContext("2d");
		if (noiseContext) {
			const image = noiseContext.createImageData(noiseCanvas.width, noiseCanvas.height);
			const random = seededRandom(2026);
			for (let index = 0; index < image.data.length; index += 4) {
				const shade = random() > 0.48 ? 24 : 225;
				image.data[index] = shade;
				image.data[index + 1] = shade;
				image.data[index + 2] = shade;
				image.data[index + 3] = Math.floor(random() * 13);
			}
			noiseContext.putImageData(image, 0, 0);
		}

		const buildRoutes = () => {
			const random = seededRandom(Math.round(width * 13 + height * 7));
			routes = Array.from({ length: Math.max(12, Math.floor((width + height) / 120)) }, (_, index) => ({
				axis: index % 2 === 0 ? "x" : "y",
				position: random(),
				speed: 18 + random() * 42,
				offset: random() * Math.max(width, height),
				length: 10 + random() * 24,
			}));
		};

		const resize = () => {
			width = window.innerWidth;
			height = window.innerHeight;
			pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * pixelRatio);
			canvas.height = Math.round(height * pixelRatio);
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
			buildRoutes();
		};

		const updatePointer = (event: PointerEvent) => {
			pointer.x = event.clientX / width;
			pointer.y = event.clientY / height;
		};

		const draw = (timestamp: number) => {
			const time = timestamp / 1000;
			easedPointer.x += (pointer.x - easedPointer.x) * 0.025;
			easedPointer.y += (pointer.y - easedPointer.y) * 0.025;
			const parallaxX = (easedPointer.x - 0.5) * 18;
			const parallaxY = (easedPointer.y - 0.5) * 18;
			const spacing = width < 620 ? 34 : 44;

			context.clearRect(0, 0, width, height);
			context.fillStyle = "#f4f0e6";
			context.fillRect(0, 0, width, height);

			context.lineWidth = 1;
			for (let x = -spacing * 2; x < width + spacing * 2; x += spacing) {
				const column = Math.round((x + spacing * 2) / spacing);
				context.strokeStyle = column % 4 === 0 ? "rgba(24,40,59,.20)" : "rgba(24,40,59,.075)";
				context.beginPath();
				context.moveTo(Math.round(x + parallaxX) + 0.5, 0);
				context.lineTo(Math.round(x + parallaxX) + 0.5, height);
				context.stroke();
			}
			for (let y = -spacing * 2; y < height + spacing * 2; y += spacing) {
				const row = Math.round((y + spacing * 2) / spacing);
				context.strokeStyle = row % 4 === 0 ? "rgba(24,40,59,.20)" : "rgba(24,40,59,.075)";
				context.beginPath();
				context.moveTo(0, Math.round(y + parallaxY) + 0.5);
				context.lineTo(width, Math.round(y + parallaxY) + 0.5);
				context.stroke();
			}

			context.strokeStyle = "rgba(36,87,214,.15)";
			context.lineWidth = 1;
			for (let row = -1; row < Math.ceil(height / (spacing * 4)) + 1; row += 1) {
				for (let column = -1; column < Math.ceil(width / (spacing * 4)) + 1; column += 1) {
					if ((column * 7 + row * 11) % 5 !== 0) continue;
					const left = column * spacing * 4 + parallaxX;
					const top = row * spacing * 4 + parallaxY;
					const size = spacing * 4;
					context.beginPath();
					context.moveTo(left, top);
					context.lineTo(left + size, top + size);
					context.moveTo(left + size, top);
					context.lineTo(left, top + size);
					context.stroke();
				}
			}

			routes.forEach((route, index) => {
				const limit = route.axis === "x" ? width : height;
				const travel = reduceMotion ? route.offset : (route.offset + time * route.speed) % (limit + 80) - 40;
				const position = route.position * (route.axis === "x" ? height : width);
				context.strokeStyle = index % 3 === 0 ? "rgba(36,87,214,.28)" : "rgba(36,87,214,.14)";
				context.lineWidth = index % 3 === 0 ? 1.4 : 1;
				context.setLineDash(index % 2 === 0 ? [7, 9] : [2, 8]);
				context.beginPath();
				if (route.axis === "x") {
					context.moveTo(0, position + parallaxY * 0.5);
					context.lineTo(width, position + parallaxY * 0.5);
				} else {
					context.moveTo(position + parallaxX * 0.5, 0);
					context.lineTo(position + parallaxX * 0.5, height);
				}
				context.stroke();
				context.setLineDash([]);

				context.fillStyle = index % 4 === 0 ? "#2457d6" : "rgba(36,87,214,.65)";
				if (route.axis === "x") {
					context.fillRect(travel, position + parallaxY * 0.5 - 2, route.length, 4);
				} else {
					context.fillRect(position + parallaxX * 0.5 - 2, travel, 4, route.length);
				}
			});

			for (let x = spacing * 2; x < width; x += spacing * 4) {
				for (let y = spacing * 2; y < height; y += spacing * 4) {
					const pulse = reduceMotion ? 0.45 : 0.35 + Math.sin(time * 1.4 + x * 0.01 + y * 0.02) * 0.18;
					context.strokeStyle = `rgba(36,87,214,${pulse})`;
					context.beginPath();
					context.arc(x + parallaxX, y + parallaxY, 5, 0, Math.PI * 2);
					context.stroke();
					context.fillStyle = "rgba(36,87,214,.5)";
					context.fillRect(x + parallaxX - 1, y + parallaxY - 1, 2, 2);
				}
			}

			const noisePattern = context.createPattern(noiseCanvas, "repeat");
			if (noisePattern) {
				context.globalAlpha = 0.55;
				context.fillStyle = noisePattern;
				context.fillRect(0, 0, width, height);
				context.globalAlpha = 1;
			}

			if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw);
		};

		resize();
		window.addEventListener("resize", resize);
		window.addEventListener("pointermove", updatePointer, { passive: true });
		draw(0);

		return () => {
			window.cancelAnimationFrame(animationFrame);
			window.removeEventListener("resize", resize);
			window.removeEventListener("pointermove", updatePointer);
		};
	}, []);

	return <canvas ref={canvasRef} className="infrastructure-backdrop" aria-hidden="true" />;
}
