const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const validCode = key => /^[A-Za-z][A-Za-z0-9]*$/.test(key ?? '') &&
  !/^(Control|Shift|Alt|Meta)(Left|Right)?$/.test(key) && !['Escape','Tab','Unidentified'].includes(key);
function validBinding(value) {
  if (typeof value !== 'string') return false;
  const parts = value.split('+');
  return validCode(parts.pop()) && parts.every(part => modifiers.includes(part));
}
export function hotkey(event, mouse = false) {
  const key = mouse ? ['MouseLeft','MouseMiddle','MouseRight','MouseBack','MouseForward'][event.button] : event.code;
  if (!validCode(key)) return null;
  return [...modifiers.filter((_, i) => [event.ctrlKey,event.altKey,event.shiftKey,event.metaKey][i]),key].join('+');
}
export function hotkeyLabel(binding) {
  return binding.split('+').map(key => ({MouseLeft:'Left click',MouseRight:'Right click',MouseMiddle:'Middle click',MouseBack:'Mouse 4',MouseForward:'Mouse 5',Space:'Space',Meta:'Meta'}[key] ?? key.replace(/^Key|^Digit/,''))).join(' + ');
}
export function assignHotkey(bindings, key, binding) {
  return {...Object.fromEntries(Object.entries(bindings).filter(([other,value]) => other !== key && value !== binding)),[key]:binding};
}

// Keybindings are shared by each spec across five-player and raid modes.
// Preserve existing raid-only preferences when no shared preference exists yet.
export function readHotkeyPreference(storage, storageKey, suffix) {
  const key = storageKey + suffix;
  const shared = storage.getItem(key);
  if (shared !== null) return shared;
  const legacy = storage.getItem(storageKey + '.raid' + suffix);
  if (legacy !== null) storage.setItem(key, legacy);
  return legacy;
}

export function mountHotkeys({root, storageKey, spells, isAvailable, cast,cancelCast=()=>{}, targetFor = (_key,index)=>index}) {
  const toggle = root.querySelector('[data-hotkey-settings]');
  const panel = root.querySelector('[data-hotkey-panel]');
  let bindings = {};
  try {
    const saved = JSON.parse(readHotkeyPreference(localStorage,storageKey,'.hotkeys'));
    for (const [key,value] of Object.entries(saved ?? {}))
      if (spells.some(spell => spell.key === key) && validBinding(value)) bindings[key] = value;
  } catch {}
  let cancelBinding=null;try{const saved=readHotkeyPreference(localStorage,storageKey,'.cancelHotkey');if(saved==='Escape'||validBinding(saved))cancelBinding=saved;}catch{}
  let editing = false, selected = null;
  panel.innerHTML = '<div data-settings-menu><button type="button" data-configure>Keybindings</button></div><div data-config hidden><h3>Keybindings</h3><p>Click on a spell, press a key, or Shift/Ctrl/Alt + key</p><p>Spells cast on mouseover targets</p><button type="button" data-cancel-binding>Cancel cast: Esc / Space</button><span class="keybinding-status" data-binding-status role="status"></span><button type="button" data-defaults>Restore defaults</button><button type="button" data-close>Close</button></div>';
  const find = selector => panel.querySelector(selector);
  const status = find('[data-binding-status]');
  const desktop = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  function position() {
    const rect = toggle.getBoundingClientRect();
    const width = editing ? 360 : 180, height = editing ? 234 : 62;
    panel.style.left = Math.max(8, Math.min(innerWidth - width - 8, rect.left)) + 'px';
    panel.style.top = Math.max(8, Math.min(innerHeight - height - 8, rect.bottom + 6)) + 'px';
  }
  function update() {
    root.classList.toggle('hotkey-configuring', editing);
    panel.classList.toggle('keybindings-open', editing);
    find('[data-config]').hidden = !editing;
    find('[data-settings-menu]').hidden = editing;
    for (const spell of spells) {
      spell.button.classList.toggle('hotkey-selected', editing && selected === spell.key);
      const shortcut=spell.button.querySelector('.spell-shortcut');shortcut.textContent=bindings[spell.key] ? hotkeyLabel(bindings[spell.key]) : spell.binding;shortcut.title=shortcut.textContent;
    }
    find('[data-cancel-binding]').textContent='Cancel cast: Esc / '+(cancelBinding?hotkeyLabel(cancelBinding):'Space');
    if (!panel.hidden) position();
  }
  function save() { try { localStorage.setItem(storageKey + '.hotkeys', JSON.stringify(bindings)); } catch {} }
  function close() {
    editing = false; selected = null; panel.hidden = true;
    toggle.setAttribute('aria-expanded','false');update();
  }
  function capture(binding) {
    if (!selected || !binding) return;
    if(selected==='__cancel'){cancelBinding=binding;bindings=Object.fromEntries(Object.entries(bindings).filter(([,value])=>value!==binding));localStorage.setItem(storageKey+'.cancelHotkey',binding);save();selected=null;status.textContent='Cancel cast: '+hotkeyLabel(binding);update();return;}
    if(binding===cancelBinding){cancelBinding=null;localStorage.setItem(storageKey+'.cancelHotkey','');}
    const name = spells.find(spell => spell.key === selected).name;
    bindings = assignHotkey(bindings,selected,binding);save();
    status.textContent = name + ': ' + hotkeyLabel(binding);
    selected = null;update();
  }
  toggle.onclick = () => {
    if (!panel.hidden) return close();
    panel.hidden = false;editing=true;toggle.setAttribute('aria-expanded','true');update();find('[data-close]').focus();
  };
  find('[data-configure]').onclick = () => { editing = true;update(); };
  find('[data-close]').onclick = close;
  find('[data-cancel-binding]').onclick=()=>{selected='__cancel';status.textContent='Press a key or combination to cancel casts.';};
  find('[data-defaults]').onclick = () => { bindings = {};cancelBinding=null;localStorage.setItem(storageKey+'.cancelHotkey','');save();selected = null;status.textContent = 'Defaults restored.';update(); };
  function hoveredTarget() {
    const frames = [...root.querySelectorAll('.heal-party button[data-party-index]')];
    const frame = frames.find(frame=>frame.matches(':hover'));
    return frame ? Number(frame.dataset.partyIndex ?? frames.indexOf(frame)) : -1;
  }
  function boundKey(binding) { return Object.keys(bindings).find(key => bindings[key] === binding && isAvailable(key)); }
  function onKey(event) {
    if (!desktop() || event.repeat || event.isComposing) return;
    if(event.code==='Escape'&&editing&&selected==='__cancel'){event.preventDefault();capture('Escape');return;}
    if (event.code === 'Escape' && !panel.hidden) { event.preventDefault();close();return; }
    if (event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
    if (!panel.hidden && event.target.closest('[data-close],[data-defaults],[data-configure],[data-hotkey-settings]')) return;
    if (editing) {
      const binding = hotkey(event);
      if (selected && binding) { event.preventDefault();event.stopPropagation();capture(binding); }
      return;
    }
    if (!panel.hidden) return;
    const binding=hotkey(event);if(!document.querySelector('dialog[open]')&&(event.code==='Escape'||binding===(cancelBinding??'Space')&&!boundKey(binding))){event.preventDefault();cancelCast();return;}
    const key = boundKey(binding);
    const target = key ? targetFor(key,hoveredTarget()) : -1;
    if (key && target >= 0) { event.preventDefault();cast(key,target); }
  }
  // Cancel side-button navigation at pointerdown, before the browser's auxclick.
  // Some mouse drivers intercept these buttons before a page receives them.
  function sideButton(event) {
    if (!desktop() || event.button < 3 || event.button > 4) return;
    const cancel=cancelBinding===hotkey(event,true);
    const key = boundKey(hotkey(event,true));
    const target = key ? targetFor(key,hoveredTarget()) : -1;
    const buttonCode = hotkey({button:event.button},true);
    const reserved = Object.values(bindings).some(binding => binding.split('+').at(-1) === buttonCode);
    if (!editing && !reserved&&!cancelBinding?.endsWith(buttonCode)) return;
    event.preventDefault();event.stopImmediatePropagation();
    if (event.type !== 'pointerdown') return;
    if (editing) capture(hotkey(event,true));
    else if(cancel)cancelCast();else if (key && target >= 0) cast(key,target);
  }
  function untargetedMouse(event) {
    if (!desktop() || event.pointerType==='touch' || editing || !panel.hidden || event.button>=3 || hoveredTarget()>=0) return;
    // Keep normal interactions with controls, text fields and links intact.
    if (event.target.closest('button,input,select,textarea,label,a,summary,dialog,[contenteditable="true"]')) return;
    const key=boundKey(hotkey(event,true));
    const target=key ? targetFor(key,-1) : -1;
    if (!key || target<0) return;
    event.preventDefault();event.stopImmediatePropagation();
    if (event.type==='pointerdown') cast(key,target);
  }
  const mouseEvents=['pointerdown','pointerup','mousedown','mouseup','click','auxclick','contextmenu'];
  for (const type of mouseEvents) document.addEventListener(type,untargetedMouse,true);
  document.addEventListener('keydown',onKey,true);
  for (const type of ['pointerdown','pointerup','mousedown','mouseup','auxclick']) document.addEventListener(type,sideButton,true);
  update();
  return {
    choose(key) {
      if (!editing || !desktop()) return false;
      selected = key;status.textContent = 'Binding ' + spells.find(spell => spell.key === key).name;update();return true;
    },
    mouse(event,index) {
      if (!desktop()) return false;
      if (editing) { if (selected) capture(hotkey(event,true));return true; }
      if (event.button >= 3) return true;
      const key = boundKey(hotkey(event,true));
      if (!key) return false;
      const target = targetFor(key,index);
      if (target < 0) return false;
      event.preventDefault();cast(key,target);return true;
    },
    has: key => !!bindings[key],
    destroy() {
      document.removeEventListener('keydown',onKey,true);
      for (const type of mouseEvents) document.removeEventListener(type,untargetedMouse,true);
      for (const type of ['pointerdown','pointerup','mousedown','mouseup','auxclick']) document.removeEventListener(type,sideButton,true);
      close();toggle.onclick = null;panel.replaceChildren();
    }
  };
}
