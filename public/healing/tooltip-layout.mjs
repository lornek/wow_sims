export function tooltipPosition(rect, width, height, viewportWidth, viewportHeight) {
  const edge = 8, gap = 8;
  // Prefer above and to the right; slide left at the page edge, never flip sides.
  const left = rect.right + gap;
  let top = rect.top - height - gap;
  if (top < edge) top = (rect.bottom ?? rect.top + (rect.height ?? 0)) + gap;
  return {left:Math.max(edge,Math.min(left,viewportWidth-width-edge)),
    top:Math.max(edge,Math.min(top,viewportHeight-height-edge))};
}
