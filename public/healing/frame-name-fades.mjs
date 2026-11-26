// Keep frame typography fixed; only mask names whose rendered text overflows.
export function mountFrameNameFades(names) {
  let active = true;
  const update = () => {
    if (!active) return;
    for (const name of names)
      name.classList.toggle('unit-name-fade', name.scrollWidth > name.clientWidth + 1);
  };
  const observer = new ResizeObserver(update);
  for (const name of names) observer.observe(name);
  window.addEventListener('resize', update);
  document.fonts?.ready.then(update);
  update();
  return () => {
    active = false;
    observer.disconnect();
    window.removeEventListener('resize', update);
  };
}
