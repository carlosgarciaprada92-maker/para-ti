(() => {
  const WHATSAPP_NUMBER = "573222270483";
  const WHATSAPP_MESSAGE = "\u0053\u00ed, acepto nuestra cita para el concierto \u2764\ufe0f\ud83c\udfb9";
  const openButton = document.querySelector('#open-envelope');
  const experience = document.querySelector('.experience');
  const invitation = document.querySelector('#invitation');
  const yesButton = document.querySelector('#yes-button');
  const accepted = document.querySelector('#accepted');
  const whatsapp = document.querySelector('#whatsapp');
  const live = document.querySelector('#live-region');
  const soundToggle = document.querySelector('#sound-toggle');
  let opened = false;
  let audioContext;
  let masterGain;
  let compressor;
  let ambientTimer;
  let soundEnabled = true;
  let lastPointerActivation = 0;
  try { soundEnabled = sessionStorage.getItem('piano-sound') !== 'off'; } catch (_) {}

  const announce = (message) => { live.textContent = message; };
  const setSoundButtonState = (active) => {
    soundToggle.setAttribute('aria-pressed', String(active));
    soundToggle.setAttribute('aria-label', active ? 'Silenciar música' : 'Activar música');
    soundToggle.querySelector('b').textContent = active ? 'Silenciar música' : 'Activar música';
  };
  const getAudioConstructor = () => window.AudioContext || window.webkitAudioContext;
  const ensureAudioGraph = () => {
    const AudioContextConstructor = getAudioConstructor();
    if (!AudioContextConstructor) return null;
    if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContextConstructor();
    if (!masterGain || masterGain.context !== audioContext) {
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.52;
      compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.28;
      masterGain.connect(compressor).connect(audioContext.destination);
    }
    return audioContext;
  };
  const unlockAudio = () => {
    try {
      const context = ensureAudioGraph();
      if (!context) return false;
      // iOS Safari can leave Web Audio suspended or interrupted until this gesture.
      if (context.state === 'suspended' || context.state === 'interrupted') context.resume();
      // A near-silent buffer unlocks the audio output in Safari and WhatsApp iOS.
      const buffer = context.createBuffer(1, 1, context.sampleRate);
      const source = context.createBufferSource(); source.buffer = buffer; source.connect(masterGain); source.start(0);
      return context.state !== 'closed';
    } catch (_) { return false; }
  };
  const playNote = (frequency, start, duration = 2.2) => {
    const context = ensureAudioGraph(); if (!context || !masterGain) return;
    const noteGain = context.createGain();
    const partials = [1, 2, 3, 4, 5, 6, 7];
    const levels = [0.82, 0.31, 0.16, 0.08, 0.045, 0.025, 0.012];
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(0.016, start + 0.38);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    noteGain.connect(masterGain);
    partials.forEach((partial, index) => {
      const oscillator = context.createOscillator(); const partialGain = context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency * partial; oscillator.detune.value = index % 2 ? -1.6 : 0.8;
      partialGain.gain.value = levels[index]; oscillator.connect(partialGain).connect(noteGain);
      oscillator.start(start); oscillator.stop(start + duration + 0.05);
    });
    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.035), context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = (Math.random() * 2 - 1) * (1 - index / noiseData.length);
    const hammer = context.createBufferSource(); const hammerFilter = context.createBiquadFilter(); const hammerGain = context.createGain();
    hammer.buffer = noiseBuffer; hammerFilter.type = 'bandpass'; hammerFilter.frequency.value = 1700; hammerFilter.Q.value = 0.7;
    hammerGain.gain.setValueAtTime(0.014, start); hammerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);
    hammer.connect(hammerFilter).connect(hammerGain).connect(noteGain); hammer.start(start);
  };
  const startAmbient = () => {
    if (!soundEnabled || ambientTimer) return Boolean(audioContext);
    const context = ensureAudioGraph(); if (!context) return false;
    masterGain.gain.setTargetAtTime(0.52, context.currentTime, 0.08);
    const phrase = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    const playPhrase = () => { const start = context.currentTime + 0.08; phrase.forEach((note, index) => playNote(note, start + index * 0.8)); };
    playPhrase(); ambientTimer = window.setInterval(playPhrase, 6400); return true;
  };
  const stopAmbient = () => {
    if (ambientTimer) { window.clearInterval(ambientTimer); ambientTimer = null; }
    if (masterGain && audioContext) { masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08); }
  };
  const celebrate = () => {
    const layer = document.createElement('div'); layer.className = 'celebration'; layer.setAttribute('aria-hidden', 'true');
    ['\u2726','\u2665','\u2727','\u274b','\u2665','\u2726','\u00b7','\u2661'].forEach((symbol, index) => { const particle = document.createElement('span'); particle.className = 'particle'; particle.textContent = symbol; particle.style.left = `${12 + index * 11}%`; particle.style.setProperty('--x', `${(index % 2 ? 1 : -1) * (18 + index * 3)}px`); particle.style.animationDelay = `${index * .1}s`; layer.appendChild(particle); });
    document.body.appendChild(layer); window.setTimeout(() => layer.remove(), 3300);
  };
  const openLetter = () => {
    if (opened) return;
    opened = true;
    const audioReady = unlockAudio();
    if (soundEnabled && audioReady) { startAmbient(); setSoundButtonState(true); } else setSoundButtonState(false);
    openButton.disabled = true; openButton.setAttribute('aria-expanded', 'true'); experience.classList.add('is-open'); invitation.setAttribute('aria-hidden', 'false'); announce('La carta se esta abriendo.');
    window.setTimeout(() => { invitation.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelector('#yes-button').focus({ preventScroll: true }); announce('La invitacion esta abierta.'); }, 1800);
  };
  const activateFromPointer = () => { lastPointerActivation = performance.now(); openLetter(); };
  const activateFromClick = () => { if (performance.now() - lastPointerActivation > 700) openLetter(); };
  const activateFromKeyboard = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lastPointerActivation = performance.now(); openLetter(); } };
  openButton.addEventListener('pointerup', activateFromPointer, { passive: true });
  openButton.addEventListener('click', activateFromClick);
  openButton.addEventListener('keydown', activateFromKeyboard);
  yesButton.addEventListener('click', () => { if (accepted.hidden) { accepted.hidden = false; yesButton.hidden = true; celebrate(); announce('Respuesta aceptada. Ahora tienen una cita.'); } });
  whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  const toggleSound = () => {
    if (soundEnabled) { soundEnabled = false; stopAmbient(); setSoundButtonState(false); }
    else { const audioReady = unlockAudio(); soundEnabled = audioReady; if (audioReady) { startAmbient(); setSoundButtonState(true); } else setSoundButtonState(false); }
    try { sessionStorage.setItem('piano-sound', soundEnabled ? 'on' : 'off'); } catch (_) {}
  };
  const activateSoundFromPointer = () => { lastPointerActivation = performance.now(); toggleSound(); };
  const activateSoundFromClick = () => { if (performance.now() - lastPointerActivation > 700) toggleSound(); };
  const activateSoundFromKeyboard = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lastPointerActivation = performance.now(); toggleSound(); } };
  soundToggle.addEventListener('pointerup', activateSoundFromPointer, { passive: true });
  soundToggle.addEventListener('click', activateSoundFromClick);
  soundToggle.addEventListener('keydown', activateSoundFromKeyboard);
  setSoundButtonState(false);
})();
