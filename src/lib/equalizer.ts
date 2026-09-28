export type EqualizerState = {
  bands: number[];
  bassBoost: boolean;
  virtualizer: boolean;
  loudness: boolean;
};

const FREQUENCIES = [60, 250, 1000, 4000, 8000, 16000];

export const DEFAULT_EQUALIZER: EqualizerState = {
  bands: [48, 68, 78, 62, 72, 56],
  bassBoost: true,
  virtualizer: true,
  loudness: true,
};

export class MuseflixAudioEngine {
  private context: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private bands: BiquadFilterNode[] = [];
  private bass: BiquadFilterNode | null = null;
  private loudness: BiquadFilterNode | null = null;
  private width: StereoPannerNode | null = null;

  connect(element: HTMLAudioElement) {
    if (this.source) return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    this.context = new AudioContextCtor();
    this.source = this.context.createMediaElementSource(element);

    this.bass = this.context.createBiquadFilter();
    this.bass.type = "lowshelf";
    this.bass.frequency.value = 120;

    this.bands = FREQUENCIES.map((frequency) => {
      const filter = this.context!.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = frequency;
      filter.Q.value = frequency < 1000 ? 0.9 : 1;
      return filter;
    });

    this.loudness = this.context.createBiquadFilter();
    this.loudness.type = "highshelf";
    this.loudness.frequency.value = 7000;

    this.width = this.context.createStereoPanner();

    let node: AudioNode = this.source;
    node.connect(this.bass);
    node = this.bass;
    for (const filter of this.bands) {
      node.connect(filter);
      node = filter;
    }
    node.connect(this.loudness);
    node = this.loudness;
    node.connect(this.width);
    this.width.connect(this.context.destination);
  }

  async resume(element: HTMLAudioElement) {
    this.connect(element);
    if (this.context?.state === "suspended") await this.context.resume();
  }

  setState(state: EqualizerState) {
    this.bands.forEach((filter, index) => {
      const value = state.bands[index] ?? 50;
      filter.gain.value = (value - 50) * 0.24;
    });
    if (this.bass) this.bass.gain.value = state.bassBoost ? 5 : 0;
    if (this.loudness) this.loudness.gain.value = state.loudness ? 2.5 : 0;
    if (this.width) this.width.pan.value = state.virtualizer ? 0.08 : 0;
  }
}
