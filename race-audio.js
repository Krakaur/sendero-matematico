// Original short motifs, synthesized locally. Audio is optional and never carries
// information that is absent from the visual response.
export const MOTIFS = Object.freeze({
  countdown: [[392,0,.14]],
  start: [[392,0,.14],[523.25,.16,.14],[659.25,.32,.25]],
  correct: [[659.25,0,.12],[880,.085,.2]],
  recover: [[523.25,0,.13],[659.25,.1,.13],[783.99,.2,.23]],
  error: [[293.66,0,.15],[261.63,.12,.23]],
  finish: [[523.25,0,.15],[659.25,.15,.15],[783.99,.3,.15],[1046.5,.5,.55]],
  pass: [[587.33,0,.12],[783.99,.1,.22]],
});

export function playMotif(context, event, volume = .65, output = context.destination) {
  const notes = MOTIFS[event];
  if (!notes) return;
  const level = Math.max(0, Math.min(1, Number(volume) || 0));
  if (level === 0) return;
  const base = context.currentTime;
  for (const [frequency, offset, duration] of notes) {
    // A rounded fundamental and a quiet overtone give a soft wooden/chime timbre.
    for (const [multiple, gain] of [[1,.13],[2,.025]]) {
      const voice = context.createOscillator(), envelope = context.createGain();
      const at = base + offset;
      voice.type = 'sine'; voice.frequency.value = frequency * multiple;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(gain * level, at + .009);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      voice.connect(envelope); envelope.connect(output);
      voice.start(at); voice.stop(at + duration + .015);
      voice.onended = () => { voice.disconnect(); envelope.disconnect(); };
    }
  }
}

export class RiverAudio {
  constructor() { this.context = null; this.ambience = null; this.effects = null; }
  unlock() {
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return this.context;
    } catch { return null; }
  }
  play(event, enabled, volume) {
    if (!enabled) return;
    const context = this.unlock();
    if (!context) return;
    if (!this.effects) {
      this.effects = context.createGain();
      this.effects.connect(context.destination);
    }
    this.effects.gain.value = 1;
    playMotif(context, event, volume, this.effects);
  }
  mute() {
    if (this.effects) this.effects.gain.value = 0;
    this.river(false);
  }
  river(enabled, volume = .2) {
    if (!enabled) {
      if (this.ambience) {
        this.ambience.source.stop();
        this.ambience.source.disconnect();
        this.ambience.filter.disconnect(); this.ambience.gain.disconnect();
        this.ambience = null;
      }
      return;
    }
    const context = this.unlock();
    if (!context) return;
    if (!this.ambience) {
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const data = buffer.getChannelData(0);
      // Smooth noise rather than sharp white noise; generated only once per run.
      let sample = 0;
      for (let i = 0; i < data.length; i++) {
        sample = (sample + .025 * (Math.random() * 2 - 1)) / 1.025;
        data[i] = sample * 3;
      }
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = buffer; source.loop = true;
      filter.type = 'lowpass'; filter.frequency.value = 900;
      source.connect(filter); filter.connect(gain); gain.connect(context.destination);
      gain.gain.value = 0;
      source.start(); this.ambience = {source, filter, gain};
    }
    this.ambience.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, Number(volume) || 0)) * .11, context.currentTime, .08);
  }
}
