import { createMemo } from "solid-js";
import p5 from "p5";
import { sketchSettings, SolidP5Wrapper } from "solid-p5-wrapper";
import paintingPaths from "./paintingPaths.json";

interface SketchProps {
	paintingName: string;
	backToLevelSelect: () => void;
	markLevelAsComplete: (score: number) => void;
	endLevel: () => void;
	setMusicDistortion: (distortion: number) => void;
}

enum SketchState {
	waiting,
	drawing,
	ending,
	win,
	fail
}

let markLevelAsComplete: (score: number) => void = () => { };
let endLevel: () => void = () => { };
let setMusicDistortion: (distortion: number) => void = () => { };

const sketchGenerator = (p5: p5) => {
	const paintingScale = 0.64;
	const failDist = 100;

	let canvas: p5.Renderer,
		ogPainting: p5.Graphics,
		fakePainting: p5.Image,
		brushImg: p5.Image;

	let focusEffects: { x: number, y: number, t: number, r: number, m: number, e: boolean }[] = [],
		paintingPath: { x: number, y: number }[];

	let brushPosition = { x: 0, y: 0 },
		brushVelocity = { x: 0, y: 0 },
		oldBrushPosition: { x: number, y: number },
		brushDists: number[] = [];

	let state: SketchState = SketchState.waiting;

	p5.preload = function () {
		brushImg = p5.loadImage("paintBrush.png");
	}

	p5.setup = function () {
		canvas = p5.createCanvas(400, 400);
		canvas.hide();

		createMemo(propsMemo);
	};

	function propsMemo() {
		const paintingName = sketchSettings.paintingName;
		paintingPath = (paintingPaths as Record<string, { x: number, y: number }[]>)[paintingName];
		brushPosition = { x: paintingPath[0].x, y: paintingPath[0].y };
		brushVelocity = { x: 0, y: 0 };
		oldBrushPosition = { ...brushPosition };
		brushDists = [];
		state = SketchState.waiting;

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
		if (state === SketchState.drawing && !hasLock) {
			state = SketchState.waiting;
			focusEffects.push({ ...brushPosition, t: p5.frameCount, r: 30, m: 1.18, e: false });
		} else if (state === SketchState.waiting && hasLock) {
			state = SketchState.drawing;
			focusEffects.push({ ...brushPosition, t: p5.frameCount, r: 2000, m: 0.85, e: false });
		}

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

		for (let i = 0; i < focusEffects.length; i++) {
			const { x, y, t, r, e } = focusEffects[i];
			const age = p5.frameCount - t;
			if (age > 30) {
				if (e) {
					state = SketchState.win;
					markLevelAsComplete(getScore());
					endLevel();
				}
				focusEffects.splice(i, 1);
				i--;
				continue;
			} else {
				focusEffects[i].r *= focusEffects[i].m;
			}
			p5.noFill();
			p5.stroke(0, 300 - age * 10);
			p5.strokeWeight(r * 0.25);
			p5.circle(x, y, r * 2);
			ogPainting.erase();
			if (e) {
				ogPainting.fill(255);
				ogPainting.circle(x, y, r * 2);
			}
		}

		p5.image(brushImg, brushPosition.x - 8, brushPosition.y - 8);

		p5.scale(1 / paintingScale);

		if (brushDists.length > 1) {
			const currentDist = brushDists[brushDists.length - 1] / failDist;
			setMusicDistortion(currentDist);
			let message, messageColor;
			if (state === SketchState.fail) {
				message = "Failure";
				messageColor = "#F11";
			} else if (state === SketchState.win) {
				message = "Successful";
				messageColor = "#80E";
			} else if (currentDist < 0.1) {
				message = "Great";
				messageColor = "#0AD";
			} else if (currentDist < 0.2) {
				message = "Good";
				messageColor = "#1B1";
			} else if (currentDist < 0.5) {
				message = "Okay";
				messageColor = "#DD0";
			} else {
				message = "Bad";
				messageColor = "#D90";
			}
			p5.textAlign(p5.CENTER, p5.CENTER);
			p5.textSize(32);
			p5.noStroke();
			p5.fill(0);
			p5.text(message, p5.width / 2 + 3, p5.height - 20 + 3);
			p5.fill(messageColor);
			p5.text(message, p5.width / 2, p5.height - 20);
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
		brushVelocity.x += p5.movedX * 0.012;
		brushVelocity.y += p5.movedY * 0.012;
		brushVelocity.x *= 0.99;
		brushVelocity.y *= 0.99;
		brushPosition.x += brushVelocity.x;
		brushPosition.y += brushVelocity.y;

		if (Math.hypot(brushPosition.x - oldBrushPosition.x, brushPosition.y - oldBrushPosition.y) > 5) {
			ogPainting.noStroke();
			ogPainting.erase();
			ogPainting.fill(255, 32);
			for (let i = 0; i < 32; i++) {
				const a = p5.random(p5.TAU);
				const d = p5.randomGaussian(0, 35);
				ogPainting.circle(oldBrushPosition.x + Math.sign(a) * d, oldBrushPosition.y + Math.sin(a) * d, 24);
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
			if (brushDist > failDist) {
				p5.exitPointerLock();
				state = SketchState.fail;
				endLevel();
			}
			brushDists.push(brushDist);

			const lastPoint = paintingPath[paintingPath.length - 1];
			if (Math.hypot(lastPoint.x - brushPosition.x, lastPoint.y - brushPosition.y) < brushDist * 1.1) {
				p5.exitPointerLock();
				state = SketchState.ending;
				focusEffects.push({ ...brushPosition, t: p5.frameCount, r: 30, m: 1.18, e: true });
			}
		}
	}

	function pointLocationAlongLine(p0: { x: number, y: number }, p1: { x: number, y: number }, p2: { x: number, y: number }) {
		const atob = { x: p2.x - p1.x, y: p2.y - p1.y };
		const atop = { x: p0.x - p1.x, y: p0.y - p1.y };
		const len = (atob.x * atob.x) + (atob.y * atob.y);
		let dot = (atop.x * atob.x) + (atop.y * atob.y);
		return dot / len;
	}

	function getScore() {
		let sum = 0;
		for (const dist of brushDists) {
			sum += 1 - dist / failDist;
		}
		return (sum / brushDists.length) ** 2;
	}

	p5.mousePressed = function () {
		if (state !== SketchState.waiting) return;
		if (p5.mouseX < 0 || p5.mouseY < 0 ||
			p5.mouseX > p5.width || p5.mouseY > p5.height) return;
		p5.requestPointerLock();
		brushVelocity = { x: 0, y: 0 };
	}
};

const Sketch = (props: SketchProps) => {
	markLevelAsComplete = props.markLevelAsComplete;
	endLevel = props.endLevel;
	setMusicDistortion = props.setMusicDistortion;

	return (
		<SolidP5Wrapper
			sketch={sketchGenerator}
			paintingName={props.paintingName}
		/>
	);
};
export default Sketch;
