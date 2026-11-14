export function tooltipPosition(rect, width, height, viewportWidth, viewportHeight) {
  const edge = 8, gap = 8;
  let left = rect.right + gap;
  if (left + width > viewportWidth - edge) {
    left = rect.left - width - gap;
    if (left < edge) left = rect.left + (rect.width - width) / 2;
  }
  let top = rect.top;
  if (top + height > viewportHeight - edge && rect.top - height - gap >= edge) top = rect.top - height - gap;
  return {left:Math.max(edge,Math.min(left,viewportWidth-width-edge)),
    top:Math.max(edge,Math.min(top,viewportHeight-height-edge))};
}
