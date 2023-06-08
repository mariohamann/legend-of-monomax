type AudioEvent = {
  duration: number;
};

type AudioBuffers = {
  [id: string]: AudioBuffer | null;
};

type AudioData = {
  loop?: string;
  ending?: string;
};

export class AudioPlayer {
  private audioContext: AudioContext;
  private audioBuffers: AudioBuffers;
  private currentPart: string | null;
  private currentSource: AudioBufferSourceNode | null;
  private currentSourceStartTime: number | null;

  constructor(private audioData: AudioData[]) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioBuffers = {};
    this.currentPart = null;
    this.currentSource = null;
    this.currentSourceStartTime = null;
  }

  async loadAudioBuffers() {
    for (const part in this.audioData) {
      const loop = this.audioData[part].loop;
      const ending = this.audioData[part].ending;
      if (loop) {
        this.audioBuffers[`${part}-loop`] = await this.loadAudio(loop);
      } else {
        this.audioBuffers[`${part}-loop`] = null;
      }
      if (ending) {
        this.audioBuffers[`${part}-ending`] = await this.loadAudio(ending);
      } else {
        this.audioBuffers[`${part}-ending`] = null;
      }
    }
  }

  private async loadAudio(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }

  private playAudioBuffer(buffer: AudioBuffer, loop: boolean) {
    console.log("playAudioBuffer", buffer, loop);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(this.audioContext.destination);
    source.start();
    return source;
  }

  switchToNextAudio(newPart: string) {
    if (this.currentPart === newPart && this.currentSource) {
      return;
    }

    if (this.currentSource) {
      this.currentSource.loop = false;
      this.currentSource.onended = null;
    }

    let nextAudio = this.audioBuffers[`${newPart}-loop`];
    let endingAudio =
      this.currentPart && this.currentPart !== newPart
        ? this.audioBuffers[`${this.currentPart}-ending`]
        : null;

    if (this.currentSource) {
      this.currentSource.onended = () => {
        if (endingAudio) {
          const source = this.playAudioBuffer(endingAudio, false);
          source.onended = () => {
            this.currentSource = this.playAudioBuffer(nextAudio!, true);
          };
        } else {
          this.currentSource = this.playAudioBuffer(nextAudio!, true);
        }
      };
    } else {
      this.currentSource = this.playAudioBuffer(nextAudio!, true);
    }

    if (this.currentSource && newPart !== "1") {
      const elapsedTime =
        this.audioContext.currentTime - (this.currentSourceStartTime || 0);
      const loopTimeRemaining =
        this.currentSource.buffer!.duration -
        (elapsedTime % this.currentSource.buffer!.duration);
      const eventDuration =
        loopTimeRemaining + (endingAudio ? endingAudio.duration : 0);
      this.emitAudioEvent({ duration: eventDuration });
    }

    this.currentPart = newPart;
  }

  private emitAudioEvent(event: AudioEvent) {
    const audioEvent = new CustomEvent("audioEvent", {
      detail: event,
    });
    window.dispatchEvent(audioEvent);
  }
}
