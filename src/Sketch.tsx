import { createMemo } from "solid-js";
import p5 from "p5";
import { sketchSettings, SolidP5Wrapper } from "solid-p5-wrapper";
import paintingPaths from "./paintingPaths.json";

interface SketchProps {
	paintingName: string;
	backToLevelSelect: () => void;
}

const sketchGenerator = (p5: p5) => {
	let canvas: p5.Renderer,
		ogPainting: p5.Image,
		fakePainting: p5.Image,
		paintingPath: { x: number, y: number }[];

	p5.setup = function () {
		canvas = p5.createCanvas(400, 400);
		canvas.hide();
		p5.colorMode(p5.HSL);

		createMemo(propsMemo);
	};

	function propsMemo() {
		const props = sketchSettings.props as SketchProps;
		const paintingName = props.paintingName;
		paintingPath = (paintingPaths as Record<string, { x: number, y: number }[]>)[paintingName];

		canvas.hide();
		fakePainting = p5.loadImage(`${paintingName}_fake.png`);
		ogPainting = p5.loadImage(`${paintingName}_og.png`, ({ width, height }) => {
			p5.resizeCanvas(width * 0.75, height * 0.75);
			canvas.show();
		});
	}

	p5.draw = function () {
		if (!ogPainting || !fakePainting) return;
		p5.scale(0.75);
		p5.image(ogPainting, 0, 0);
		drawDottedLine(paintingPath);
	};

	function drawDottedLine(points: { x: number, y: number }[]) {
		p5.strokeWeight(6);
		const ctx = p5.drawingContext;
		ctx.setLineDash([12, 12]);
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();
		ctx.setLineDash([]);
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
