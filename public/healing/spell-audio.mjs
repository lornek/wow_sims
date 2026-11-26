import {spellSounds} from './spell-sounds.mjs';
import {clientSoundUrl} from './sound-library.mjs';
// HTMLAudio permits ordinary cross-origin playback without a Web Audio CORS fetch.
export function createSpellAudio({enabled, fallback, onStatus = () => {}, createAudio = url => new Audio(url)}) {
  const active = new Set(), unavailable = new Set();
  let generation = 0;
  function stop() {
    generation++;
    for (const clip of active) { clip.onended = clip.onerror = clip.onplaying = null;clip.pause(); clip.removeAttribute('src'); clip.load(); }
    active.clear();
  }
  function play(name, pulse=false) {
    const entry = spellSounds[name];
    if (!entry) return false;
    if (!enabled()) return true;
    const version = generation;
    let usedFallback = false;
    function fail() {
      if (version !== generation || !enabled() || usedFallback) return;
      usedFallback = true;onStatus('fallback');fallback();
    }
    function playClip(soundId, after) {
      if (version !== generation || !enabled()) return;
      if (unavailable.has(soundId)) { fail();return; }
      if (active.size >= 6) {
        const oldest = active.values().next().value;
        oldest.onended = oldest.onerror = oldest.onplaying = null;
        oldest.pause();active.delete(oldest);
      }
      const clip = createAudio(clientSoundUrl(soundId));
      clip.volume = .35;active.add(clip);
      let released = false;
      const release = () => {
        if (released) return false;
        released = true;active.delete(clip);
        clip.onended = clip.onerror = clip.onplaying = null;
        return true;
      };
      clip.onended = () => { if (release() && after) after(); };
      clip.onplaying = () => { if (version === generation && enabled()) onStatus('playing'); };
      const failed = () => {
        if (!release()) return;
        unavailable.add(soundId);fail();
      };
      clip.onerror = failed;
      try { Promise.resolve(clip.play()).catch(failed); } catch { failed(); }
    }
    for (const [index,id] of (pulse ? entry.pulse ? [entry.pulse] : [] : entry.landing).entries()) playClip(id, !pulse&&index===0&&entry.after ? () => playClip(entry.after) : null);
    return true;
  }
  return {play, heal:name=>play(name,true), stop};
}
