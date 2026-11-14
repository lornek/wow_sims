// Clear rendered results as well as the fresh combat state created for each pull.
export function resetHealingReport(root, meterRows, manaRows) {
  for (const {row, summary, total, fields, eventBars} of meterRows.values()) {
    row.hidden = true;
    row.open = false;
    summary.style.setProperty('--share', '0%');
    total.textContent = '';
    eventBars?.replaceChildren();
    for (const field of fields) field.textContent = '';
  }
  root.querySelector('[data-score-total]').textContent = '';
  root.querySelector('[data-score-heading]').hidden = true;
  root.querySelector('[data-mana-gained-total]').textContent = '0';
  root.querySelector('[data-mana-meter]').replaceChildren();
  manaRows.clear();
  for (const selector of ['[data-result]', '[data-regen-result]']) {
    const element = root.querySelector(selector);
    element.replaceChildren();
    element.hidden = true;
    element.removeAttribute('title');
  }
  root.querySelector('[data-meter-empty]').hidden = false;
  root.querySelector('[data-mana-empty]').hidden = false;
}
