
class PixelAnimation {
  constructor(options = {}) {
    this.fullscreen = !options.el;
    this.el = options.el || document.body;
    this.color = options.color || "black";
    this.blockSize = options.blockSize || 2;
    this.duration = options.duration || {
      in: 1000,
      pause: 100,
      out: 1000,
    };
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    // Set canvas dimensions
    this.canvas.width =
      this.fullscreen
        ? window.innerWidth
        : this.el.offsetWidth;
    this.canvas.height =
      this.fullscreen
        ? window.innerHeight
        : this.el.offsetHeight;

    // Set canvas position to absolute
    this.canvas.style.position =
      this.fullscreen
        ? 'fixed'
        : "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";

    // Append canvas to the provided element
    this.el.appendChild(this.canvas);

    // Hide the canvas initially
    this.canvas.style.display = "none";
  }

  removeCanvas() {
    this.el.removeChild(this.canvas);
  }

  calculateIterationsAndIterationDuration(
    totalBlocks,
    animationDuration
  ) {
    let iterations = 0;
    let remainingBlocks = totalBlocks;
    let iterationDuration = 0;

    while (remainingBlocks > 0) {
      iterations++;
      remainingBlocks -= iterations;
    }

    iterationDuration = animationDuration / iterations;

    return { iterations, iterationDuration };
  }

  getDurations(duration) {
    if (typeof duration === "number") {
      return {
        in: duration / 2,
        pause: 1,
        out: duration / 2
      }
    } else {
      return {
        in: duration.in,
        pause: duration.pause,
        out: duration.out
      }
    }
  }

  async createPixels(customDuration) {
    this.createCanvas();

    const inDuration = customDuration || this.getDurations(this.duration).in;

    // Disable scrolling and show the canvas
    if (this.fullscreen) document.body.style.overflow = "hidden";
    this.canvas.style.display = "block";

    // Generate an array of all possible pixel blocks
    this.blocks = [];
    for (
      let y = 0;
      y < this.canvas.height;
      y += this.blockSize
    ) {
      for (
        let x = 0;
        x < this.canvas.width;
        x += this.blockSize
      ) {
        this.blocks.push({ x, y });
      }
    }

    // Shuffle the blocks array using Fisher-Yates algorithm
    for (let i = this.blocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.blocks[i], this.blocks[j]] = [this.blocks[j], this.blocks[i]];
    }

    this.totalBlocks = this.blocks.length;
    const {
      iterations: inIterations,
      iterationDuration: iterationDuration,
    } = this.calculateIterationsAndIterationDuration(
      this.totalBlocks,
      inDuration
    );
    let blocksPerIteration = 1;
    let index = 0;
    let startTime = performance.now();

    // Fill the canvas with pixel blocks (in-animation)
    for (let i = 0; i < inIterations; i++) {
      for (
        let j = 0;
        j < blocksPerIteration && index < this.totalBlocks;
        j++, index++
      ) {
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(
          this.blocks[index].x,
          this.blocks[index].y,
          this.blockSize,
          this.blockSize
        );
      }
      blocksPerIteration++;

      // Here we check the elapsed time and pause if necessary
      let elapsedTime = performance.now() - startTime;
      let expectedElapsedTime = iterationDuration * i;
      if (elapsedTime < expectedElapsedTime) {
        await this.sleep(expectedElapsedTime - elapsedTime);
      }
    }
  }

  async removePixels(customDuration) {
    const outDuration = customDuration || this.getDurations(this.duration).out;

    // Remove the pixel blocks (out-animation)
    this.blocks.sort(() => Math.random() - 0.5);
    const {
      iterations: outIterations,
      iterationDuration: iterationDuration,
    } = this.calculateIterationsAndIterationDuration(
      this.totalBlocks,
      outDuration
    );
    let blocksPerIteration = 1;
    let index = 0;
    let startTime = performance.now();

    for (let i = 0; i < outIterations; i++) {
      for (
        let j = 0;
        j < blocksPerIteration && index < this.totalBlocks;
        j++, index++
      ) {
        this.ctx.clearRect(
          this.blocks[index].x,
          this.blocks[index].y,
          this.blockSize,
          this.blockSize
        );
      }
      blocksPerIteration++;

      // Here we check the elapsed time and pause if necessary
      let elapsedTime = performance.now() - startTime;
      let expectedElapsedTime = iterationDuration * i;
      if (elapsedTime < expectedElapsedTime) {
        await this.sleep(expectedElapsedTime - elapsedTime);
      }
    }

    // Hide the canvas and enable scrolling
    this.canvas.style.display = "none";
    if (this.fullscreen) document.body.style.overflow = "auto";

    this.removeCanvas();
  }

  async animatePixels(customDuration) {
    const customDurations = this.getDurations(customDuration || this.duration);
    const { in: inDuration, pause, out: outDuration } = customDurations;

    await this.createPixels(inDuration);
    await this.sleep(pause);
    await this.removePixels(outDuration);
  }

  // Utility function to pause for a specified duration
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


export default PixelAnimation;
