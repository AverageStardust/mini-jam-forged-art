import { Show, createSignal } from "solid-js";
import Sketch from "./Sketch";

function App() {
	const [painting, setPainting] = createSignal<null | "sonOfMan">(null);
	const [paintingIsComplete, setPaintingIsComplete] = createSignal<[boolean, boolean, boolean]>([false, true, false]);

	return <>
		<Show when={painting() == null}>
			<h1>Art Forgery!</h1>

			<p class="moto">See original, Forge it, Profit...</p>

			<div class="levels">
				<div classList={{
					level: true,
					complete: paintingIsComplete()[0]
				}} onClick={() => setPainting("sonOfMan")}>
					<img src="./level_1_thumbnail.png"></img>
					<Show when={paintingIsComplete()[0]}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z"/></svg>
					</Show>
				</div>
				<div classList={{
					level: true,
					complete: paintingIsComplete()[1]
				}} onClick={() => setPainting("sonOfMan")}>
					<img src="./level_2_thumbnail.png"></img>
					<Show when={paintingIsComplete()[1]}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z"/></svg>
					</Show>
				</div>
				<div classList={{
					level: true,
					complete: paintingIsComplete()[2]
				}} onClick={() => setPainting("sonOfMan")}>
					<img src="./level_3_thumbnail.png"></img>
					<Show when={paintingIsComplete()[2]}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z"/></svg>
					</Show>
				</div>
			</div>
		</Show>

		<Show when={painting() != null}>
			<Sketch paintingName={painting()!} backToLevelSelect={() => setPainting(null)}></Sketch>
			<button onClick={() => setPainting(null)}>Back to Levels</button>
		</Show>
	</>;
}

export default App;
