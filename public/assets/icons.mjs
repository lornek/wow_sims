const search = document.querySelector('#icon-search');
const cards = [...document.querySelectorAll('.icon-card')];
const count = document.querySelector('[data-icon-count]');
const empty = document.querySelector('[data-icon-empty]');
const params = new URLSearchParams(location.search);
search.value = params.get('q') ?? '';
function filter() {
  const words = search.value.toLowerCase().trim().split(/[\s_]+/).filter(Boolean);
  let matches = 0;
  for (const card of cards) {
    card.hidden = !words.every(word => card.dataset.name.includes(word));
    if (!card.hidden) matches++;
  }
  for (const section of document.querySelectorAll('.icon-section')) {
    const icons = [...section.querySelectorAll('.icon-card')];
    const visible = icons.filter(icon => !icon.hidden).length;
    section.querySelector('[data-section-count]').textContent = visible + ' of ' + icons.length + ' icons';
    section.querySelector('[data-section-empty]').hidden = visible !== 0;
  }
  count.textContent = matches + ' of ' + cards.length + ' icons';
  empty.hidden = matches !== 0;
  const url = new URL(location.href);
  if (search.value) url.searchParams.set('q', search.value);
  else url.searchParams.delete('q');
  history.replaceState(null, '', url);
}
search.addEventListener('input', filter);
filter();
