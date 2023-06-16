type AudioEvent = {
  duration: number;
};

type AudioBuffers = {
  [id: string]: AudioBuffer | null;
};

type AudioData = {
  loop?: string;
  ending?: string;
  crossfades?: Boolean;
};

export class AudioPlayer {
  public audioContext: AudioContext;
  private audioBuffers: AudioBuffers;
  private currentPart: number | null;
  private currentSource: AudioBufferSourceNode | null;
  private currentSourceStartTime: number | null;
  private currentGainNode: GainNode | null;

  constructor(private audioData: AudioData[]) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.audioBuffers = {};
    this.currentPart = null;
    this.currentSource = null;
    this.currentSourceStartTime = null;
    this.currentGainNode = null;
  }

  async loadAudioBuffers() {
    const promises = [];

    for (const part in this.audioData) {
      const loop = this.audioData[part].loop;
      const ending = this.audioData[part].ending;
      if (loop) {
        promises.push(
          this.loadAudio(loop).then(buffer => {
            this.audioBuffers[`${part}-loop`] = buffer;
          })
        );
      } else {
        this.audioBuffers[`${part}-loop`] = null;
      }
      if (ending) {
        promises.push(
          this.loadAudio(ending).then(buffer => {
            this.audioBuffers[`${part}-ending`] = buffer;
          })
        );
      } else {
        this.audioBuffers[`${part}-ending`] = null;
      }
    }

    await Promise.all(promises);
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

  private playAudioBuffer(buffer: AudioBuffer, loop: boolean, startTime = 0) {
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.loop = loop;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0, startTime);

    return { source, gainNode };
  }

  switchToNextAudio(newPart: number) {
    if (this.currentPart === newPart && this.currentSource) {
      return;
    }

    if (this.currentSource) {
      this.currentSource.loop = false;
      this.currentSource.onended = null;
    }

    let nextLoopAudio = this.audioBuffers[`${newPart}-loop`];
    let nextEndingAudio = this.audioBuffers[`${newPart}-ending`];
    let endingAudio = this.currentPart !== null && this.currentPart !== newPart ? this.audioBuffers[`${this.currentPart}-ending`] : null;

    let crossfade = this.audioData[this.currentPart]?.crossfades || false;

    if (crossfade && this.currentSource && this.currentGainNode) {
      let elapsedTime = this.audioContext.currentTime - this.currentSourceStartTime;
      let loopTime = elapsedTime % this.currentSource.buffer.duration;

      // If we are in crossfade mode, play both the loop and ending audios at once, then fade out the loop
      let loopSource = this.currentSource;
      let loopGainNode = this.currentGainNode;
      let endingSource = this.playAudioBuffer(endingAudio, false, loopTime);

      this.currentSource = endingSource.source;
      this.currentGainNode = endingSource.gainNode;

      loopGainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
      loopGainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      this.currentGainNode.gain.setValueAtTime(0.01, this.audioContext.currentTime);
      this.currentGainNode.gain.exponentialRampToValueAtTime(1, this.audioContext.currentTime + 0.5);

      loopSource.stop(this.audioContext.currentTime + 0.5);
      loopSource.stop(this.audioContext.currentTime + 0.5);

      this.currentSource.onended = () => {
        if (nextLoopAudio) {
          this.currentSource = this.playAudioBuffer(nextLoopAudio, true).source;
        } else if (nextEndingAudio) {
          this.currentSource = this.playAudioBuffer(nextEndingAudio, false).source;
          this.currentSource.onended = () => {
            this.currentSource = null;
          };
        } else {
          this.currentSource = null;
        }
      };
    } else if (this.currentSource) {
      this.currentSource.onended = () => {
        if (endingAudio) {
          const source = this.playAudioBuffer(endingAudio, false);
          source.source.onended = () => {
            if (nextLoopAudio) {
              this.currentSource = this.playAudioBuffer(nextLoopAudio, true).source;
            } else if (nextEndingAudio) {
              this.currentSource = this.playAudioBuffer(nextEndingAudio, false).source;
              this.currentSource.onended = () => {
                this.currentSource = null;
              };
            } else {
              this.currentSource = null;
            }
          };
        } else {
          if (nextLoopAudio) {
            this.currentSource = this.playAudioBuffer(nextLoopAudio, true).source;
          } else if (nextEndingAudio) {
            this.currentSource = this.playAudioBuffer(nextEndingAudio, false).source;
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
        let output = this.playAudioBuffer(nextLoopAudio, true);
        this.currentSource = output.source;
        this.currentGainNode = output.gainNode; // Remember to set this.currentGainNode!
      } else if (nextEndingAudio) {
        let output = this.playAudioBuffer(nextEndingAudio, false);
        this.currentSource = output.source;
        this.currentGainNode = output.gainNode; // Remember to set this.currentGainNode!
      } else {
        this.currentSource = null;
        this.currentGainNode = null; // Remember to set this.currentGainNode!
      }
    }

    if (this.currentSource) {
      const elapsedTime = this.audioContext.currentTime - (this.currentSourceStartTime || 0);
      const loopTimeRemaining = this.currentSource.buffer!.duration - (elapsedTime % this.currentSource.buffer!.duration);

      let eventDuration;

      if (crossfade) {
        eventDuration = loopTimeRemaining;
      } else {
        eventDuration = loopTimeRemaining + (endingAudio ? endingAudio.duration : 0);
      }

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
