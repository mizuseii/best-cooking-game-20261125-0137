// Every sound is synthesized with WebAudio: no audio files, no network.
// The context is created lazily on the first user gesture, as browsers require.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleTimer = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, filterFreq, when = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    isMuted() { return muted; },

    /** A soft click when an ingredient drops into the wok. */
    chop() { tone(320, 0.07, 'triangle', 0.16); noise(0.05, 0.10, 2400); },
    /** The wok hisses while something cooks. */
    sizzle() { noise(0.28, 0.05, 5200); },
    startSizzleLoop() {
      if (sizzleTimer) return;
      sizzleTimer = setInterval(() => this.sizzle(), 320);
    },
    stopSizzle() {
      if (sizzleTimer) { clearInterval(sizzleTimer); sizzleTimer = null; }
    },
    /** A bright ding when a dish is plated and ready to serve. */
    ding() { tone(880, 0.35, 'sine', 0.18); tone(1318, 0.4, 'sine', 0.12, 0.08); },
    /** Coins clink when a customer pays. */
    coins() { tone(1568, 0.09, 'square', 0.07); tone(2093, 0.14, 'square', 0.06, 0.07); },
    /** A low buzz when the wrong dish is served. */
    wrong() { tone(160, 0.28, 'sawtooth', 0.10, 0, 110); },
    /** A thud when a customer storms off. */
    stormOff() { tone(90, 0.3, 'sine', 0.2, 0, 55); noise(0.18, 0.12, 300); },
    /** A short jingle at the end of the shift. */
    jingle() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11));
    },
    /** A soft pop when a new customer arrives. */
    arrive() { tone(660, 0.08, 'sine', 0.10, 0, 880); },
    /** The wok is dumped: a scrape and a splash. */
    dump() { noise(0.22, 0.12, 900); tone(220, 0.16, 'triangle', 0.08, 0.05, 140); },
  };
}
