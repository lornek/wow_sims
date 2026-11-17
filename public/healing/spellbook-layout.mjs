export const spellsPerPage = 12;
export function spellbookStatus(status) {
  if (status === 'unchanged') return 'same';
  return ['new','changed','removed','same'].includes(status) ? status : 'unclassified';
}
export function spellbookEntries(rows, {school, query = '', level = 60, allRanks = false, status = 'all'} = {}) {
  const needle = query.trim().toLowerCase();
  const result = [];
  for (const [order, entry] of rows.entries()) {
    if (entry.status === 'removed') continue;
    if ((!needle && entry.school !== school?.toLowerCase()) || !entry.name.toLowerCase().includes(needle)) continue;
    if (status !== 'all' && spellbookStatus(entry.status) !== status) continue;
    const available = entry.ranks.filter(({rank}) => rank.level <= level);
    for (const rank of allRanks ? available : available.slice(-1)) result.push({...entry, ...rank, status:spellbookStatus(entry.status), learnedAt:Math.min(...entry.ranks.map(({rank})=>rank.level)), order});
  }
  return result.sort((a,b) => a.learnedAt - b.learnedAt || a.order - b.order || a.rank.level - b.rank.level);
}
export function spellbookPage(entries, page = 0) {
  const pages = Math.max(1, Math.ceil(entries.length / spellsPerPage));
  const index = Math.max(0, Math.min(pages - 1, Math.trunc(page) || 0));
  const shown = entries.slice(index * spellsPerPage, (index + 1) * spellsPerPage);
  return {index, pages, left:shown.slice(0,6), right:shown.slice(6)};
}
