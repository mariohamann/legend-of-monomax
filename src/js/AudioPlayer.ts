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

  private loadAudio(url: string): Promise<AudioBuffer> {
    return fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        return new Promise((resolve, reject) => {
          this.audioContext.decodeAudioData(arrayBuffer, resolve, reject);
        });
      });
  }

  private playAudioBuffer(buffer: AudioBuffer, loop: boolean) {
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

    let nextLoopAudio = this.audioBuffers[`${newPart}-loop`];
    let nextEndingAudio = this.audioBuffers[`${newPart}-ending`];
    let endingAudio =
      this.currentPart && this.currentPart !== newPart
        ? this.audioBuffers[`${this.currentPart}-ending`]
        : null;

    if (this.currentSource) {
      this.currentSource.onended = () => {
        if (endingAudio) {
          const source = this.playAudioBuffer(endingAudio, false);
          source.onended = () => {
            if (nextLoopAudio) {
              this.currentSource = this.playAudioBuffer(nextLoopAudio, true);
            } else if (nextEndingAudio) {
              this.currentSource = this.playAudioBuffer(nextEndingAudio, false);
              this.currentSource.onended = () => {
                this.currentSource = null;
              };
            } else {
              this.currentSource = null;
            }
          };
        } else {
          if (nextLoopAudio) {
            this.currentSource = this.playAudioBuffer(nextLoopAudio, true);
          } else if (nextEndingAudio) {
            this.currentSource = this.playAudioBuffer(nextEndingAudio, false);
            this.currentSource.onended = () => {
              this.currentSource = null;
            };
          } else {
            this.currentSource = null;
          }
        }
      };
    } else {
      if (nextLoopAudio) {
        this.currentSource = this.playAudioBuffer(nextLoopAudio, true);
      } else if (nextEndingAudio) {
        this.currentSource = this.playAudioBuffer(nextEndingAudio, false);
        this.currentSource.onended = () => {
          this.currentSource = null;
        };
      } else {
        this.currentSource = null;
      }
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
