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
  let ambientGain;
  let ambientTimer;
  let soundEnabled = true;
  try { soundEnabled = sessionStorage.getItem('piano-sound') !== 'off'; } catch (_) {}

  const announce = (message) => { live.textContent = message; };
  const getAudio = () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  };
  const playNote = (frequency, start, duration = 2.2) => {
    const context = getAudio();
    const noteGain = context.createGain();
    const partials = [1, 2, 3, 4, 5, 6, 7];
    const levels = [0.82, 0.31, 0.16, 0.08, 0.045, 0.025, 0.012];
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.exponentialRampToValueAtTime(0.038, start + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(0.012, start + 0.38);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    noteGain.connect(ambientGain || context.destination);
    partials.forEach((partial, index) => {
      const oscillator = context.createOscillator();
      const partialGain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * partial;
      oscillator.detune.value = index % 2 ? -1.6 : 0.8;
      partialGain.gain.value = levels[index];
      oscillator.connect(partialGain).connect(noteGain);
      oscillator.start(start); oscillator.stop(start + duration + 0.05);
    });
    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.035), context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = (Math.random() * 2 - 1) * (1 - index / noiseData.length);
    const hammer = context.createBufferSource();
    const hammerFilter = context.createBiquadFilter();
    const hammerGain = context.createGain();
    hammer.buffer = noiseBuffer; hammerFilter.type = 'bandpass'; hammerFilter.frequency.value = 1700; hammerFilter.Q.value = 0.7;
    hammerGain.gain.setValueAtTime(0.012, start); hammerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);
    hammer.connect(hammerFilter).connect(hammerGain).connect(noteGain); hammer.start(start);
  };
  const startAmbient = () => {
    if (!soundEnabled || ambientTimer) return;
    const context = getAudio();
    ambientGain = context.createGain(); ambientGain.gain.value = 0.28; ambientGain.connect(context.destination);
    const phrase = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    const playPhrase = () => { const start = context.currentTime + 0.08; phrase.forEach((note, index) => playNote(note, start + index * 0.8)); };
    playPhrase(); ambientTimer = window.setInterval(playPhrase, 6400);
  };
  const stopAmbient = () => {
    if (ambientTimer) { window.clearInterval(ambientTimer); ambientTimer = null; }
    if (ambientGain) { ambientGain.gain.setTargetAtTime(0.0001, getAudio().currentTime, 0.08); ambientGain = null; }
  };
  const celebrate = () => {
    const layer = document.createElement('div'); layer.className = 'celebration'; layer.setAttribute('aria-hidden', 'true');
    ['\u2726','\u2665','\u2727','\u274b','\u2665','\u2726','\u00b7','\u2661'].forEach((symbol, index) => { const particle = document.createElement('span'); particle.className = 'particle'; particle.textContent = symbol; particle.style.left = `${12 + index * 11}%`; particle.style.setProperty('--x', `${(index % 2 ? 1 : -1) * (18 + index * 3)}px`); particle.style.animationDelay = `${index * .1}s`; layer.appendChild(particle); });
    document.body.appendChild(layer); window.setTimeout(() => layer.remove(), 3300);
  };
  const openLetter = () => {
    if (opened) return; opened = true; openButton.disabled = true; openButton.setAttribute('aria-expanded', 'true'); experience.classList.add('is-open'); invitation.setAttribute('aria-hidden', 'false'); announce('La carta se esta abriendo.');
    if (soundEnabled) { try { startAmbient(); } catch (_) {} }
    window.setTimeout(() => { invitation.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelector('#yes-button').focus({ preventScroll: true }); announce('La invitacion esta abierta.'); }, 1800);
  };
  openButton.addEventListener('click', openLetter);
  yesButton.addEventListener('click', () => { if (accepted.hidden) { accepted.hidden = false; yesButton.hidden = true; celebrate(); announce('Respuesta aceptada. Ahora tienen una cita.'); } });
  whatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled; soundToggle.setAttribute('aria-pressed', String(soundEnabled)); soundToggle.setAttribute('aria-label', soundEnabled ? 'Silenciar sonido suave' : 'Activar sonido suave'); soundToggle.querySelector('b').textContent = soundEnabled ? 'Sonido activo' : 'Sonido suave';
    try { sessionStorage.setItem('piano-sound', soundEnabled ? 'on' : 'off'); } catch (_) {}
    if (soundEnabled && opened) { try { startAmbient(); } catch (_) {} } else stopAmbient();
  });
  soundToggle.setAttribute('aria-pressed', String(soundEnabled)); soundToggle.setAttribute('aria-label', soundEnabled ? 'Silenciar sonido suave' : 'Activar sonido suave'); soundToggle.querySelector('b').textContent = soundEnabled ? 'Sonido activo' : 'Sonido suave';
})();
