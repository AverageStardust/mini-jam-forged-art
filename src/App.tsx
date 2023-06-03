import { createSignal } from "solid-js";

import Sketch from "./Sketch";

function App() {
	const [painting, setPainting] = createSignal(0);

	return (
		<div>
			<Sketch paintingName="sonOfMan"></Sketch>
		</div>
	);
}

export default App;
