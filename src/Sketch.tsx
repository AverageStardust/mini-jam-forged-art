import { createMemo } from "solid-js";
import p5 from "p5";
import { sketchSettings, SolidP5Wrapper } from "solid-p5-wrapper";
import paintingPaths from "./paintingPaths.json";

interface SketchProps {
	paintingName: string;
}

const sketchGenerator = (p5: p5) => {
	const paintingScale = 0.64;
	let canvas: p5.Renderer,
		ogPainting: p5.Graphics,
		fakePainting: p5.Image,
		paintingPath: { x: number, y: number }[];

	let dropEffects: { x: number, y: number, t: number }[] = [];

	let brushPosition = { x: 0, y: 0 },
		brushVelocity = { x: 0, y: 0 },
		oldBrushPosition: { x: number, y: number };

	p5.setup = function () {
		canvas = p5.createCanvas(400, 400);
		canvas.hide();

		createMemo(propsMemo);
	};

	function propsMemo() {
		const props = sketchSettings.props as SketchProps;
		const paintingName = props.paintingName;
		paintingPath = (paintingPaths as Record<string, { x: number, y: number }[]>)[paintingName];
		brushPosition = { x: paintingPath[0].x, y: paintingPath[0].y };
		brushVelocity = { x: 0, y: 0 };
		oldBrushPosition = { ...brushPosition };

		canvas.hide();
		fakePainting = p5.loadImage(`${paintingName}_fake.png`);
		p5.loadImage(`${paintingName}_og.png`, (img) => {
			ogPainting = p5.createGraphics(img.width, img.height);
			ogPainting.image(img, 0, 0);
			p5.resizeCanvas(img.width * paintingScale, img.height * paintingScale);
			canvas.show();
		});
	}

	p5.draw = function () {
		if (!ogPainting || !fakePainting) return;

		const hasLock = document.pointerLockElement === canvas.elt;

		if (hasLock) update();

		p5.scale(paintingScale);
		p5.image(fakePainting, 0, 0);
		p5.image(ogPainting, 0, 0);

		p5.drawingContext.setLineDash([12, 12]);
		p5.stroke(255);
		p5.translate(2, 2);
		p5.strokeWeight(6);
		drawPath(paintingPath);
		p5.translate(-3, -3);
		p5.stroke(0);
		drawPath(paintingPath);
		p5.drawingContext.setLineDash([]);

		for (let i = 0; i < dropEffects.length; i++) {
			const { x, y, t } = dropEffects[i];
			const age = p5.frameCount - t;
			if (age > 30) {
				dropEffects.splice(i, 1);
				i--;
				continue;
			}
			p5.noFill();
			const radius = 300 / (age + 0.1);
			p5.stroke(0, 300 - age * 10);
			p5.strokeWeight(radius * 0.25);
			p5.circle(x, y, radius * 2);
		}

		if (hasLock) {
			p5.stroke(0);
			p5.strokeWeight(6);
			p5.line(brushPosition.x, brushPosition.y, brushPosition.x + 12, brushPosition.y);
			p5.line(brushPosition.x, brushPosition.y, brushPosition.x, brushPosition.y + 12);
			p5.line(brushPosition.x, brushPosition.y, brushPosition.x + 32, brushPosition.y + 32);
		}
	};

	function drawPath(points: { x: number, y: number }[]) {
		const ctx = p5.drawingContext;
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();
	}

	function update() {
		brushVelocity.x += p5.movedX * 0.008;
		brushVelocity.y += p5.movedY * 0.008;
		brushVelocity.x *= 0.98;
		brushVelocity.y *= 0.98;
		brushPosition.x += brushVelocity.x;
		brushPosition.y += brushVelocity.y;

		if (Math.hypot(brushPosition.x - oldBrushPosition.x, brushPosition.y - oldBrushPosition.y) > 5) {
			ogPainting.erase();
			ogPainting.fill(255, 32);
			ogPainting.noStroke();
			for (let i = 0; i < 32; i++) {
				ogPainting.circle(oldBrushPosition.x + p5.randomGaussian(0, 15), oldBrushPosition.y + p5.randomGaussian(0, 15), 16);
			}
			oldBrushPosition = { ...brushPosition };

			let brushDist = Infinity;
			for (let i = 0; i < paintingPath.length - 1; i++) {
				const p0 = paintingPath[i];
				const p1 = paintingPath[i + 1];
				const amount = p5.constrain(pointLocationAlongLine(brushPosition, p0, p1), 0, 1);
				const lineDist = Math.hypot(
					brushPosition.x - p5.lerp(p0.x, p1.x, amount),
					brushPosition.y - p5.lerp(p0.y, p1.y, amount));
				brushDist = Math.min(brushDist, lineDist);
			}
			console.log(brushDist)
		}
	}

	function pointLocationAlongLine(p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }) {
		const atob = { x: p2.x - p1.x, y: p2.y - p1.y };
		const atop = { x: p0.x - p1.x, y: p0.y - p1.y };
		const len = (atob.x * atob.x) + (atob.y * atob.y);
		let dot = (atop.x * atob.x) + (atop.y * atob.y);
		return dot / len;
	}

	p5.mousePressed = function () {
		p5.requestPointerLock();
		brushVelocity = { x: 0, y: 0 };
		dropEffects.push({ ...brushPosition, t: p5.frameCount });
	}
};

const Sketch = (props: SketchProps) => {
	return (
		<SolidP5Wrapper
			sketch={sketchGenerator}
			props={props}
		/>
	);
};
export default Sketch;
