<script lang="ts">
	import svelteLogo from "./assets/svelte.svg";
	import viteLogo from "/vite.svg";
	import Counter from "./lib/Counter.svelte";
</script>

<main>
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
		<button type="button" data-chapter="3" onclick="changeChapter(4)"
			>4</button
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

		function getAudioUrls(chapter) {
			const basePath = "/src/assets/audio/";
			const loopUrl = `${basePath}${chapter}-loop.m4a`;
			const endingUrl = `${basePath}${chapter}-ending.m4a`;
			return { loopUrl, endingUrl };
		}
		const numberOfChapters = 11;
		const audioBuffers = {};

		(async () => {
			for (let chapter = 1; chapter <= numberOfChapters; chapter++) {
				const { loopUrl, endingUrl } = getAudioUrls(chapter);

				// Chapter 11 only has an ending
				if (chapter < numberOfChapters) {
					audioBuffers[`${chapter}-loop`] = await loadAudio(loopUrl);
				}

				// Chapter 1 only has a loop
				if (chapter > 1 && chapter < numberOfChapters) {
					audioBuffers[`${chapter}-ending`] = await loadAudio(
						endingUrl
					);
				}
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

			let nextAudio = audioBuffers[`${newChapter}-loop`];
			let endingAudio =
				currentChapter && currentChapter !== numberOfChapters
					? audioBuffers[`${currentChapter}-ending`]
					: null;

			if (currentSource) {
				currentSource.onended = () => {
					if (endingAudio) {
						const source = playAudioBuffer(endingAudio, false);
						source.onended = () => {
							currentSource = playAudioBuffer(
								nextAudio,
								newChapter !== numberOfChapters
							);
						};
					} else {
						currentSource = playAudioBuffer(
							nextAudio,
							newChapter !== numberOfChapters
						);
					}
				};
			} else {
				currentSource = playAudioBuffer(
					nextAudio,
					newChapter !== numberOfChapters
				);
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
