import { createMemo } from "solid-js";
import p5 from "p5";
import { sketchSettings, SolidP5Wrapper } from "solid-p5-wrapper";

interface SketchProps {
	paintingName: string;
}

const sketch = (p5: p5) => {
	let paintingName: string;

	createMemo(() => {
		const props = sketchSettings.props as SketchProps;
		paintingName = props.paintingName;
	});

	p5.setup = function () {
		const canvas = p5.createCanvas(400, 400);
		p5.colorMode(p5.HSL);
	};

	p5.draw = function () {
		p5.background(p5.millis() * 0.1 % 360, 100, 90);
		p5.textAlign(p5.CENTER, p5.CENTER);
		p5.text(paintingName, 200, 200);
	};

	p5.mousePressed = function () {
		console.log("clicked");
	};
};

const Sketch = (props: SketchProps) => {
	return (
		<SolidP5Wrapper
			sketch={sketch}
			props={props}
		/>
	);
};
export default Sketch;
