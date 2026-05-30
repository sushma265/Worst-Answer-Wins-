// Web Audio API sound synthesizer — no files needed
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function beep({ freq = 440, type = "sine", duration = 0.15, gain = 0.3, delay = 0 }) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    gainNode.gain.setValueAtTime(gain, ac.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration + 0.05);
  } catch {}
}

const sounds = {
  join: () => {
    beep({ freq: 523, duration: 0.1, gain: 0.2 });
    beep({ freq: 659, duration: 0.1, gain: 0.2, delay: 0.1 });
    beep({ freq: 784, duration: 0.15, gain: 0.25, delay: 0.2 });
  },
  submit: () => {
    beep({ freq: 440, type: "square", duration: 0.08, gain: 0.15 });
    beep({ freq: 660, type: "square", duration: 0.08, gain: 0.15, delay: 0.08 });
  },
  allIn: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      beep({ freq: f, duration: 0.12, gain: 0.25, delay: i * 0.08 })
    );
  },
  roundStart: () => {
    beep({ freq: 392, duration: 0.12, gain: 0.3 });
    beep({ freq: 523, duration: 0.12, gain: 0.3, delay: 0.13 });
    beep({ freq: 659, duration: 0.12, gain: 0.3, delay: 0.26 });
    beep({ freq: 784, duration: 0.2, gain: 0.35, delay: 0.39 });
  },
  thinking: () => {
    for (let i = 0; i < 5; i++) {
      beep({ freq: 300 + i * 40, type: "sine", duration: 0.15, gain: 0.15, delay: i * 0.2 });
    }
  },
  results: () => {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((f, i) => beep({ freq: f, duration: 0.15, gain: 0.25, delay: i * 0.12 }));
  },
  winner: () => {
    const fanfare = [523, 523, 523, 784, 659, 523, 784, 659];
    fanfare.forEach((f, i) => beep({ freq: f, duration: 0.2, gain: 0.3, delay: i * 0.18 }));
  },
  tick: () => {
    beep({ freq: 880, type: "square", duration: 0.06, gain: 0.12 });
  },
};

export function playSound(name) {
  try {
    sounds[name]?.();
  } catch {}
}
