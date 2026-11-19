// Stock client references, not yet verified against the Forever client.
export const shamanSoundIds = Object.freeze({
  'Healing Wave': 568917,
  'Lesser Healing Wave': 568917,
  'Chain Heal': 567124,
  'Riptide': 568126,
  'Cure Poison': 569632,
  'Water Shield': 569207,
  'Healing Stream Totem': 562732,
  'Mana Spring Totem': 562732,
  'Mana Tide Totem': 562732,
  "Nature's Swiftness": 569767,
});

// HTMLAudio permits ordinary cross-origin playback without a Web Audio CORS fetch.
export function createShamanAudio({enabled, fallback, createAudio = url => new Audio(url)}) {
  const active = new Set(), unavailable = new Set();
  let generation = 0;
  function stop() {
    generation++;
    for (const clip of active) { clip.pause(); clip.removeAttribute('src'); clip.load(); }
    active.clear();
  }
  function play(name) {
    const id = shamanSoundIds[name];
    if (!id) return false;
    if (!enabled()) return true;
    if (unavailable.has(id)) { fallback(); return true; }
    // Cap simultaneous voices without combining combat events or changing simulation RNG.
    if (active.size >= 6) { const oldest = active.values().next().value; oldest.pause(); active.delete(oldest); }
    const clip = createAudio(`https://wow.zamimg.com/sound-ids/live/enus/${id}`);
    const version = generation;
    clip.volume = .35;
    active.add(clip);
    const release = () => active.delete(clip);
    clip.onended = release;
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true; release(); unavailable.add(id);
      if (version === generation && enabled()) fallback();
    };
    clip.onerror = fail;
    try { Promise.resolve(clip.play()).catch(fail); } catch { fail(); }
    return true;
  }
  return {play, stop};
}
