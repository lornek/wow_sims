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

const soundFiles = Object.freeze({
  568917: 'restorationimpact.ogg',
  567124: 'blastedlandslightningbolt01stand-bolt1.ogg',
  568126: 'mage_riptide_impact.ogg',
  569632: 'nullifypoison.ogg',
  569207: 'watershield_impact_base.ogg',
  562732: 'totembirthgenerica.ogg',
  569767: 'naturecast.ogg',
  569376: 'renew.ogg',
});

export function shamanSoundUrl(id) {
  const file = soundFiles[id];
  return file ? `https://wow.zamimg.com/sound-ids/live/enus/${id % 256}/${id}/${file}` : null;
}

// HTMLAudio permits ordinary cross-origin playback without a Web Audio CORS fetch.
export function createShamanAudio({enabled, fallback, onStatus = () => {}, createAudio = url => new Audio(url)}) {
  const active = new Set(), unavailable = new Set();
  let generation = 0;
  function stop() {
    generation++;
    for (const clip of active) { clip.onended = clip.onerror = clip.onplaying = null;clip.pause(); clip.removeAttribute('src'); clip.load(); }
    active.clear();
  }
  function play(name) {
    const id = shamanSoundIds[name];
    if (!id) return false;
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
      const clip = createAudio(shamanSoundUrl(soundId));
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
    playClip(id, name === 'Healing Stream Totem' ? () => playClip(569376) : null);
    if (name === 'Chain Heal') playClip(569767);
    return true;
  }
  return {play, stop};
}
