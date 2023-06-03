import { Show, createSignal } from "solid-js";
import Sketch from "./Sketch";

type PaintingName = "sonOfMan" | "natureMorte" | "theRoom";

function App() {
	const [painting, setPainting] = createSignal<null | PaintingName>(null);
	const [paintingIsComplete, setPaintingIsComplete] = createSignal<Map<PaintingName, number>>(new Map());

	return <>
		<Show when={painting() == null}>
			<h1>One Stroke Forger!</h1>

			<p class="moto">See original, Forge it, Profit...</p>

			<div class="levels">
				<div classList={{
					level: true,
					complete: paintingIsComplete().has("sonOfMan")
				}} onClick={() => setPainting("sonOfMan")}>
					<img src="./level_1_thumbnail.png"></img>
					<Show when={paintingIsComplete().has("sonOfMan")}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z" /></svg>
						<strong class="score">${Math.floor((paintingIsComplete().get("sonOfMan") ?? 0) * 1000)}k</strong>
					</Show>
				</div>
				<div classList={{
					level: true,
					complete: paintingIsComplete().has("natureMorte")
				}} onClick={() => setPainting("natureMorte")}>
					<img src="./level_2_thumbnail.png"></img>
					<Show when={paintingIsComplete().has("natureMorte")}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z" /></svg>
						<strong class="score">${Math.floor((paintingIsComplete().get("natureMorte") ?? 0) * 1000)}k</strong>
					</Show>
				</div>
				<div classList={{
					level: true,
					complete: paintingIsComplete().has("theRoom")
				}} onClick={() => setPainting("theRoom")}>
					<img src="./level_3_thumbnail.png"></img>
					<Show when={paintingIsComplete().has("theRoom")}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z" /></svg>
						<strong class="score">${Math.floor((paintingIsComplete().get("theRoom") ?? 0) * 1000)}k</strong>
					</Show>
				</div>
			</div>
		</Show>

		<Show when={painting() != null}>
			<Sketch paintingName={painting()!} backToLevelSelect={() => setPainting(null)} markLevelAsComplete={
				(score: number) => {
					setPaintingIsComplete((complete) => {
						const paintingName = painting();
						if (paintingName === null) return complete;
						complete.set(paintingName, Math.max(score, complete.get(paintingName) ?? 0));
						return complete;
					})
				}}></Sketch>
			<button onClick={() => setPainting(null)}>Back to Levels</button>
		</Show>
	</>;
}

export default App;
