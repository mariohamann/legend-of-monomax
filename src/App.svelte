<script lang="ts">
	import svelteLogo from "./assets/svelte.svg";
	import viteLogo from "/vite.svg";
	import Counter from "./lib/Counter.svelte";
</script>

<main>
	<!-- <audio id="myAudio" src="/src/assets/HeadlessHeroMastered.aif"></audio>
  <button type="button" data-start="8.727" data-stop="17.454">1</button>
  <button type="button" data-start="17.455" data-stop="28.182">1</button> -->

	<div>
		<button type="button" data-chapter="1" onclick="changeChapter(1)"
			>1</button
		>
		<button type="button" data-chapter="2" onclick="changeChapter(2)"
			>2</button
		>
		<button type="button" data-chapter="3" onclick="changeChapter(3)"
			>3</button
		>
		<a href="https://vitejs.dev" target="_blank" rel="noreferrer">
			<img src={viteLogo} class="logo" alt="Vite Logo" />
		</a>
		<a href="https://svelte.dev" target="_blank" rel="noreferrer">
			<img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
		</a>
	</div>
	<h1>Vite + Svelte</h1>

	<div class="card">
		<Counter />
	</div>

	<p>
		Check out <a
			href="https://github.com/sveltejs/kit#readme"
			target="_blank"
			rel="noreferrer">SvelteKit</a
		>, the official Svelte app framework powered by Vite!
	</p>

	<p class="read-the-docs">
		Click on the Vite and Svelte logos to learn more
	</p>

	<script>
		const audioContext = new (window.AudioContext ||
			window.webkitAudioContext)();

		async function loadAudio(url) {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			return audioBuffer;
		}

		const audioFiles = {
			"1-loop": "/src/assets/audio/1-loop.m4a",
			"2-loop": "/src/assets/audio/2-loop.m4a",
			"2-ending": "/src/assets/audio/2-ending.m4a",
			"3-loop": "/src/assets/audio/3-loop.m4a",
			"3-ending": "/src/assets/audio/3-ending.m4a",
		};

		const audioBuffers = {};

		(async () => {
			for (const id in audioFiles) {
				audioBuffers[id] = await loadAudio(audioFiles[id]);
			}
		})();

		let currentChapter = null;
		let currentSource = null;

		function playAudioBuffer(buffer, loop, onEnded) {
			const source = audioContext.createBufferSource();
			source.buffer = buffer;
			source.loop = loop;
			source.connect(audioContext.destination);

			if (onEnded) {
				source.onended = onEnded;
			}

			source.start();
			return source;
		}

		function changeChapter(newChapter) {
			if (currentChapter === newChapter && currentSource) {
				return;
			}

			if (currentSource) {
				currentSource.loop = false;
				currentSource.onended = null;
			}

			let nextAudio;
			let endingAudio;

			if (newChapter === 1) {
				nextAudio = audioBuffers["1-loop"];
				endingAudio = null;
			} else if (newChapter === 2) {
				nextAudio = audioBuffers["2-loop"];
				endingAudio = null;
			} else if (newChapter === 3) {
				nextAudio = audioBuffers["3-loop"];
				endingAudio =
					currentChapter === 2 ? audioBuffers["2-ending"] : null;
			}

			if (currentSource) {
				currentSource.onended = () => {
					if (endingAudio) {
						const source = playAudioBuffer(endingAudio, false);
						source.onended = () => {
							currentSource = playAudioBuffer(nextAudio, true);
						};
					} else {
						currentSource = playAudioBuffer(nextAudio, true);
					}
				};
			} else {
				currentSource = playAudioBuffer(nextAudio, true);
			}

			currentChapter = newChapter;
		}
	</script>
</main>

<style>
	.logo {
		height: 6em;
		padding: 1.5em;
		will-change: filter;
		transition: filter 300ms;
	}
	.logo:hover {
		filter: drop-shadow(0 0 2em #646cffaa);
	}
	.logo.svelte:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}
	.read-the-docs {
		color: #888;
	}
</style>
