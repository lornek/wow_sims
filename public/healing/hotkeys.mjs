const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const validCode = key => /^[A-Za-z][A-Za-z0-9]*$/.test(key ?? '') &&
  !/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(key) && !['Escape','Tab','Unidentified'].includes(key);
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

export function mountHotkeys({root, storageKey, spells, isAvailable, cast}) {
  const toggle = root.querySelector('[data-hotkey-settings]');
  const panel = root.querySelector('[data-hotkey-panel]');
  let bindings = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey + '.hotkeys'));
    for (const [key,value] of Object.entries(saved ?? {}))
      if (spells.some(spell => spell.key === key) && validBinding(value)) bindings[key] = value;
  } catch {}
  let editing = false, selected = null, candidate = null;
  panel.innerHTML = '<h3>Hotkeys</h3><p>Hover a party member and press an assigned hotkey to cast. Bindings are saved for this healer.</p><button type="button" data-configure>Configure hotkeys</button><div data-config hidden><p>Select a spell on the action bar, then press a key or combination. For a mouse binding, click the capture button below.</p><p data-binding-status role="status"></p><button type="button" data-capture>Capture mouse button</button><button type="button" data-confirm disabled>Confirm binding</button><button type="button" data-done>Done</button></div><button type="button" data-defaults>Restore default click casting</button><button type="button" data-close>Close</button>';
  const find = selector => panel.querySelector(selector);
  const status = find('[data-binding-status]');
  function update() {
    root.classList.toggle('hotkey-configuring', editing);
    find('[data-config]').hidden = !editing;
    find('[data-configure]').hidden = editing;
    find('[data-confirm]').disabled = !candidate;
    for (const spell of spells) {
      spell.button.classList.toggle('hotkey-selected', editing && selected === spell.key);
      spell.button.querySelector('.spell-shortcut').textContent = bindings[spell.key] ? hotkeyLabel(bindings[spell.key]) : spell.binding;
    }
  }
  function save() { try { localStorage.setItem(storageKey + '.hotkeys', JSON.stringify(bindings)); } catch {} }
  function close() {
    editing = false; selected = candidate = null; panel.hidden = true;
    toggle.setAttribute('aria-expanded','false');update();
  }
  function capture(binding) {
    if (!selected || !binding) return;
    candidate = binding;
    const conflict = spells.find(spell => spell.key !== selected && bindings[spell.key] === binding);
    status.textContent = hotkeyLabel(binding) + ' → ' + spells.find(spell => spell.key === selected).name + (conflict ? ' (replaces ' + conflict.name + ')' : '') + '. Confirm to save.';
    update();
  }
  toggle.onclick = () => {
    if (!panel.hidden) return close();
    panel.hidden = false;toggle.setAttribute('aria-expanded','true');find('[data-configure]').focus();
  };
  find('[data-configure]').onclick = () => { editing = true;status.textContent = 'Select a spell to configure.';update(); };
  find('[data-close]').onclick = close;
  find('[data-done]').onclick = () => { editing = false;selected = candidate = null;update(); };
  find('[data-confirm]').onclick = () => {
    if (!selected || !candidate) return;
    bindings = assignHotkey(bindings,selected,candidate);save();
    status.textContent = 'Saved. Select another spell or choose Done.';
    selected = candidate = null;update();
  };
  find('[data-defaults]').onclick = () => { bindings = {};save();selected = candidate = null;status.textContent = 'Default click casting restored.';update(); };
  find('[data-capture]').onpointerdown = event => { if (editing && selected) { event.preventDefault();capture(hotkey(event,true)); } };
  find('[data-capture]').oncontextmenu = event => event.preventDefault();
  const desktop = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  function onKey(event) {
    if (!desktop() || event.repeat || event.isComposing) return;
    if (event.code === 'Escape' && !panel.hidden) { event.preventDefault();close();return; }
    if (event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
    if (event.target.closest('[data-confirm],[data-done],[data-close],[data-defaults],[data-configure],[data-hotkey-settings]')) return;
    if (editing) {
      const binding = hotkey(event);
      if (selected && binding) { event.preventDefault();event.stopPropagation();capture(binding); }
      return;
    }
    if (!panel.hidden) return;
    const binding = hotkey(event);
    const key = Object.keys(bindings).find(key => bindings[key] === binding && isAvailable(key));
    const target = [...root.querySelectorAll('.heal-party > button')].findIndex(frame => frame.matches(':hover'));
    if (key && target >= 0) { event.preventDefault();cast(key,target); }
  }
  document.addEventListener('keydown',onKey,true);
  update();
  return {
    choose(key) {
      if (!editing || !desktop()) return false;
      selected = key;candidate = null;status.textContent = 'Press a key combination for ' + spells.find(spell => spell.key === key).name + '.';update();return true;
    },
    mouse(event,index) {
      if (!desktop()) return false;
      if (editing) return true;
      const binding = hotkey(event,true);
      const key = Object.keys(bindings).find(key => bindings[key] === binding && isAvailable(key));
      if (!key) return false;
      event.preventDefault();cast(key,index);return true;
    },
    has: key => !!bindings[key],
    destroy() { document.removeEventListener('keydown',onKey,true);close();toggle.onclick = null;panel.replaceChildren(); }
  };
}
