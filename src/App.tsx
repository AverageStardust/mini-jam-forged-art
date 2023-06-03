import { Show, createSignal, createEffect } from "solid-js";
import Sketch from "./Sketch";
import { Howl } from "howler";

type PaintingName = "sonOfMan" | "natureMorte" | "theRoom";

function App() {
	const [painting, setPainting] = createSignal<null | PaintingName>(null);
	const [paintingIsComplete, setPaintingIsComplete] = createSignal<Map<PaintingName, number>>(new Map());

	const [secondsBeforeLevelSelect, setSecondsBeforeLevelSelect] = createSignal<null | number>(null);
	let intervalReference: number | null = null;

	const tapSound = new Howl({
		src: ["./sounds/UIClick.mp3"],
	});
	const hoverSound = new Howl({
		src: ["./sounds/UIHover.mp3"],
	});
	const music = new Howl({
		src: ["./sounds/Music.mp3"],
		loop: true,
		volume: 0.5,
	});
	const musicGlitch = new Howl({
		src: ["./sounds/MusicGlitch.mp3"],
		loop: true,
		volume: 0,
	});
	music.play();
	musicGlitch.play();

	function setMusicDistortion(distortion: number) {
		music.volume((1 - distortion) * 0.5);
		musicGlitch.volume(distortion);
	}

	createEffect(() => {
		if (painting() == null) {
			setMusicDistortion(0);
		}
	})

	return <>
		<Show when={painting() == null}>
			<h1>One Stroke Forger!</h1>

			<p class="moto">See original, Forge it, Profit...</p>

			<div class="levels">
				<div classList={{
					level: true,
					complete: paintingIsComplete().has("sonOfMan")
				}} onClick={() => {
					if (intervalReference != null) {
						clearInterval(intervalReference);
						setSecondsBeforeLevelSelect(null);
					}
					hoverSound.play();
					setPainting("sonOfMan");
				}}>
					<img src="./level_1_thumbnail.png"></img>
					<Show when={paintingIsComplete().has("sonOfMan")}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z" /></svg>
						<strong class="score">${Math.floor((paintingIsComplete().get("sonOfMan") ?? 0) * 1000)}k</strong>
					</Show>
				</div>
				<div classList={{
					level: true,
					complete: paintingIsComplete().has("natureMorte")
				}} onClick={() => {
					if (intervalReference != null) {
						clearInterval(intervalReference);
						setSecondsBeforeLevelSelect(null);
					}
					hoverSound.play();
					setPainting("natureMorte");
				}}>
					<img src="./level_2_thumbnail.png"></img>
					<Show when={paintingIsComplete().has("natureMorte")}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z" /></svg>
						<strong class="score">${Math.floor((paintingIsComplete().get("natureMorte") ?? 0) * 1000)}k</strong>
					</Show>
				</div>
				<div classList={{
					level: true,
					complete: paintingIsComplete().has("theRoom")
				}} onClick={() => {
					if (intervalReference != null) {
						clearInterval(intervalReference);
						setSecondsBeforeLevelSelect(null);
					}
					hoverSound.play();
					setPainting("theRoom");
				}}>
					<img src="./level_3_thumbnail.png"></img>
					<Show when={paintingIsComplete().has("theRoom")}>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 11.386l1.17-1.206c1.951.522 5.313 1.731 8.33 3.597 3.175-4.177 9.582-9.398 13.456-11.777l1.044 1.073-14 18.927-10-10.614z" /></svg>
						<strong class="score">${Math.floor((paintingIsComplete().get("theRoom") ?? 0) * 1000)}k</strong>
					</Show>
				</div>
			</div>
		</Show>

		<Show when={painting() != null}>
			<Sketch paintingName={painting()!} backToLevelSelect={() => setPainting(null)} endLevel={() => {
				setSecondsBeforeLevelSelect(5);
				intervalReference = setInterval(() => {
					const seconds = secondsBeforeLevelSelect();

					if (seconds != null) {
						if (seconds <= 0) {
							setPainting(null);

							if (intervalReference != null) {
								clearInterval(intervalReference);
								setSecondsBeforeLevelSelect(null);
							}
						} else {
							setSecondsBeforeLevelSelect(seconds - 1);
						}
					};
				}, 1000);
			}} markLevelAsComplete={
				(score: number) => {
					setPaintingIsComplete((complete) => {
						const paintingName = painting();
						if (paintingName == null) return complete;
						complete.set(paintingName, Math.max(score, complete.get(paintingName) ?? 0));
						return complete;
					})
				}} setMusicDistortion={setMusicDistortion}></Sketch>
			<button onClick={() => {
				if (intervalReference != null) {
					clearInterval(intervalReference);
					setSecondsBeforeLevelSelect(null);
				}
				hoverSound.play();
				setPainting(null);
			}}>Back to Levels <Show when={secondsBeforeLevelSelect() != null}> in {secondsBeforeLevelSelect()}s</Show></button>
		</Show>
	</>;
}

export default App;
