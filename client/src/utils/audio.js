// HTML5 Web Audio API Synthesizer for tactile chat sound effects

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play a tactile "swoosh/sweep" sound when a message is successfully sent
export const playSendSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency sweeps upwards from A4 (440Hz) to A5 (880Hz)
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    // Fade out gain quickly
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
};

// Play a friendly double-beep sound when a message is received from another user
export const playReceiveSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Play D5 (587Hz) and then quickly shift to A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);

    // Fade out gain gently
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
};

let ringInterval = null;

// Play a telephone ring tone on a loop (440Hz + 480Hz sinusoids)
export const playRingTone = () => {
  try {
    const ctx = getAudioContext();
    
    const playPulsedRing = () => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      // Bell ring cadence: on for 1.2 seconds, then fade out
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    };

    // Play immediate first pulse and loop every 3 seconds
    playPulsedRing();
    ringInterval = setInterval(playPulsedRing, 3000);
  } catch (err) {
    console.error('Audio synthesizer error (ringtone):', err);
  }
};

// Stop the running telephone ringtone loop
export const stopRingTone = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

// Play a declining chime when a call disconnects
export const playHangupSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Declining pitch sweep from E4 (330Hz) to A3 (220Hz)
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    console.error('Audio synthesizer error (hangup):', err);
  }
};
