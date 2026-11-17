export function scoreFitScale(available, natural) {
  return natural > 0 ? Math.min(1, Math.max(0, available) / natural) : 1;
}

export function fitScoreFormula(element) {
  if (element.hidden || !element.clientWidth) return;
  element.style.setProperty('--score-fit', '1');
  const style = getComputedStyle(element);
  const available = element.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0);
  const width = [...element.children].reduce((sum, term) => sum + term.getBoundingClientRect().width, 0) +
    Math.max(0, element.children.length - 1) * (parseFloat(style.columnGap) || 0);
  // Leave a pixel for subpixel font/layout rounding, rather than clipping a digit.
  element.style.setProperty('--score-fit', String(scoreFitScale(Math.max(0, available - 1), width)));
}

export function watchScoreFormula(element) {
  let disposed = false;
  const fit = () => { if (!disposed) fitScoreFormula(element); };
  const resize = new ResizeObserver(fit);
  resize.observe(element);
  const content = new MutationObserver(fit);
  content.observe(element, {childList:true,characterData:true,subtree:true});
  document.fonts?.ready.then(fit);
  document.fonts?.addEventListener('loadingdone', fit);
  fit();
  return () => {
    disposed = true;
    resize.disconnect(); content.disconnect();
    document.fonts?.removeEventListener('loadingdone', fit);
  };
}
