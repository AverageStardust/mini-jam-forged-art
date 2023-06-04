import { createMemo } from "solid-js";
import p5 from "p5";
import { sketchSettings, SolidP5Wrapper } from "solid-p5-wrapper";
import paintingPaths from "./paintingPaths.json";
import { Howl } from "howler";
import { Vec2 } from "./vector2";
import { PaintingName } from "./App";

interface SketchProps {
	paintingName: PaintingName;
	backToLevelSelect: () => void;
	markLevelAsComplete: (score: number) => void;
	endLevel: () => void;
	setMusicDistortion: (distortion: number) => void;
}

interface FocusEffect {
	position: Vec2;
	frame: number;
	radius: number;
	radiusMultiplier: number;
	ending: boolean;
}

enum SketchState {
	waiting, // waiting for mouse lock
	drawing,
	finished, // game just finished (only 1 frame)
	ending, // playing ending animation
	win,
	fail
}

const brushSounds: Howl[] = [];
let markLevelAsComplete: (score: number) => void = () => { };
let endLevel: () => void = () => { };
let setMusicDistortion: (distortion: number) => void = () => { };

for (let i = 0; i < 3; i++) {
	brushSounds.push(new Howl({
		src: ["./sounds/brush" + i + ".mp3"],
	}));
}

const sketchGenerator = (p5: p5) => {
	const paintingScale = 0.64;
	const failDist = 100;

	let canvas: p5.Renderer,
		ogPainting: p5.Graphics,
		fakePainting: p5.Image,
		brushImg: p5.Image;

	let focusEffects: FocusEffect[] = [],
		paintingPath: Vec2[] = [];

	let brushPosition = new Vec2(),
		brushVelocity = new Vec2(),
		oldBrushPosition = new Vec2(),
		brushDists: number[] = [],
		brushDist = 0,
		brushProgress = 0,
		brushSoundAccumulator = 0;

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
		const paintingName = sketchSettings.paintingName as PaintingName;
		paintingPath = paintingPaths[paintingName].map((obj) => new Vec2(obj));
		brushPosition = new Vec2(paintingPath[0]);
		brushVelocity = new Vec2();
		oldBrushPosition = new Vec2(brushPosition);
		brushDists = [];
		brushDist = 0;
		brushProgress = 0;
		brushSoundAccumulator = 0;
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
		const drawingOrFinished = (state === SketchState.drawing || state === SketchState.finished);

		if (!hasLock && drawingOrFinished) {
			if (state === SketchState.drawing) {
				state = SketchState.waiting;
			} else {
				state = SketchState.ending;
			}
			focusEffects.push({
				position: brushPosition,
				frame: p5.frameCount,
				radius: 30,
				radiusMultiplier: 1.18,
				ending: state === SketchState.ending
			});
		} else if (hasLock && state === SketchState.waiting) {
			state = SketchState.drawing;
			focusEffects.push({
				position: brushPosition,
				frame: p5.frameCount,
				radius: 2000,
				radiusMultiplier: 0.85,
				ending: false
			});
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
			const { position, frame, radius, radiusMultiplier, ending } = focusEffects[i];
			const age = p5.frameCount - frame;
			if (age > 30) {
				if (ending) {
					state = SketchState.win;
					markLevelAsComplete(getScore());
					endLevel();
				}
				focusEffects.splice(i, 1);
				i--;
				continue;
			} else {
				focusEffects[i].radius *= radiusMultiplier;
			}
			p5.noFill();
			p5.stroke(0, 300 - age * 10);
			p5.strokeWeight(radius * 0.25);
			p5.circle(position.x, position.y, radius * 2);
			ogPainting.erase();
			if (ending) {
				ogPainting.fill(255);
				ogPainting.circle(position.x, position.y, radius * 2);
			}
		}

		p5.image(brushImg, brushPosition.x - 8, brushPosition.y - 8);

		p5.scale(1 / paintingScale);

		const accuracy = brushDist / failDist;
		console.log(accuracy)
		setMusicDistortion(accuracy ** 0.9);

		let message, messageColor;
		if (state === SketchState.fail) {
			message = "Failure";
			messageColor = p5.color("#F11");
		} else if (state === SketchState.win) {
			message = "Success";
			messageColor = p5.color("#0F3");
		} else {
			message = "$" + Math.floor(getScore() * brushProgress * 1000) + "k";
			if (accuracy < 1 / 4) {
				messageColor = this.lerpColor(p5.color("#0F3"), p5.color("#DD0"), accuracy * 4);
			} else {
				messageColor = this.lerpColor(p5.color("#DD0"), p5.color("#F11"), (accuracy * 4 - 1) / 3);
			}
		}
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.textSize(32);
		p5.noStroke();
		p5.fill(0);
		p5.text(message, p5.width / 2 + 3, p5.height - 20 + 3);
		p5.fill(messageColor);
		p5.text(message, p5.width / 2, p5.height - 20);
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
		const mouseVelocity = new Vec2(p5.movedX, p5.movedY);
		// accelerate slow, decelerate fast
		const friction = mouseVelocity.mag > brushVelocity.mag ? 0.08 : 0.12;
		const brushAcceleration = mouseVelocity.sub(brushVelocity).limit(friction);
		brushVelocity = brushVelocity.add(brushAcceleration);
		brushPosition = brushPosition.add(brushVelocity);

		brushSoundAccumulator += (Math.sqrt(mouseVelocity.mag) * 0.00015 + Math.sqrt(brushAcceleration.mag) * 0.001) / friction;
		if (brushSoundAccumulator > Math.random() * 5) {
			playBrushSound(brushSoundAccumulator);
			brushSoundAccumulator = 0;
		}

		if (Math.hypot(brushPosition.x - oldBrushPosition.x, brushPosition.y - oldBrushPosition.y) > 5) {
			ogPainting.noStroke();
			ogPainting.erase();
			ogPainting.fill(255, 32);
			for (let i = 0; i < 32; i++) {
				const a = p5.random(p5.TAU);
				const d = p5.randomGaussian(0, 35);
				ogPainting.circle(oldBrushPosition.x + Math.sign(a) * d, oldBrushPosition.y + Math.sin(a) * d, 24);
			}
			oldBrushPosition = new Vec2(brushPosition);

			brushDist = Infinity;
			let totalPathLength = 0, lengthBeforeBest = 0, lengthAfterBest = 0;
			for (let i = 0; i < paintingPath.length - 1; i++) {
				const p0 = paintingPath[i];
				const p1 = paintingPath[i + 1];
				const lineLength = p0.dist(p1);
				const amount = p5.constrain(pointLocationAlongLine(brushPosition, p0, p1), 0, 1);
				const nearestPoint = p0.lerp(p1, amount);
				const currentBrushDist = brushPosition.dist(nearestPoint);

				totalPathLength += lineLength;
				if (currentBrushDist < brushDist) {
					brushDist = currentBrushDist;
					lengthBeforeBest += lengthAfterBest;
					lengthAfterBest = p1.dist(nearestPoint);
					lengthBeforeBest += lineLength - lengthAfterBest;
				} else {
					lengthAfterBest += lineLength;
				}
			}

			if (brushDist > failDist) {
				p5.exitPointerLock();
				state = SketchState.fail;
				endLevel();
				return;
			}

			const currentProgress = lengthBeforeBest / totalPathLength;
			if (currentProgress > brushProgress) {
				brushDists.push(brushDist);
				brushProgress = currentProgress;
			}

			const lastPoint = paintingPath[paintingPath.length - 1];
			if (Math.hypot(lastPoint.x - brushPosition.x, lastPoint.y - brushPosition.y) < brushDist * 1.1) {
				p5.exitPointerLock();
				state = SketchState.finished;
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
		if (brushDists.length === 0) return 0;
		let sum = 0;
		for (const dist of brushDists) {
			sum += 1 - dist / failDist;
		}
		return (sum / brushDists.length) ** 2;
	}

	function playBrushSound(volume: number) {
		const brushSound = brushSounds[Math.floor(p5.random(3))];
		const id = brushSound.play();
		brushSound.rate(p5.randomGaussian(1, 0.01), id);
		brushSound.volume(volume, id);
	}

	p5.mousePressed = function () {
		if (state !== SketchState.waiting) return;
		if (p5.mouseX < 0 || p5.mouseY < 0 ||
			p5.mouseX > p5.width || p5.mouseY > p5.height) return;
		p5.requestPointerLock();
		brushVelocity = new Vec2();
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
