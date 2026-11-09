import { armorByLevel } from './sunder-armor-data.mjs';

const ranks = [[10, 90], [22, 180], [34, 270], [46, 360], [58, 450]];
const levelInput = document.querySelector('#sunder-level');
const typeInput = document.querySelector('#sunder-type');
const levelValue = document.querySelector('#sunder-level-value');
const summary = document.querySelector('#sunder-summary');
const stackRows = document.querySelector('#sunder-stacks');
const number = new Intl.NumberFormat();
const percent = gain => (gain > 0 ? '+' : '') + gain.toFixed(2) + '%';

function render() {
  const level = levelInput.valueAsNumber;
  const armor = armorByLevel[level - 1][Number(typeInput.value)];
  const rank = ranks.findLastIndex(([trainingLevel]) => level >= trainingLevel);
  const perStack = rank < 0 ? 0 : ranks[rank][1];
  const armorConstant = 400 + 85 * level;
  const armorLeft = stacks => Math.max(0, armor - stacks * perStack);
  const gain = (before, after) => 100 * (before - after) / (armorConstant + after);
  const maxGain = gain(armor, armorLeft(5));

  levelValue.textContent = level;
  summary.textContent = `${number.format(armor)} estimated starting armor · ` +
    (rank < 0 ? 'Sunder Armor unlocks at level 10' :
      `Rank ${rank + 1} · −${perStack} armor per stack · ${percent(maxGain)} DPS at 5 stacks`);

  stackRows.innerHTML = Array.from({ length: 6 }, (_, stacks) => {
    const left = armorLeft(stacks);
    const total = gain(armor, left);
    const incremental = gain(armorLeft(Math.max(0, stacks - 1)), left);
    const width = maxGain > 0 ? 100 * total / maxGain : 0;
    const unavailable = rank < 0 && stacks > 0;
    return `<tr>
      <th scope="row">${stacks}</th>
      <td>${unavailable ? '—' : number.format(left)}</td>
      <td>${unavailable ? '—' : percent(total)}
        <div class="progress" aria-hidden="true"><div class="progress-bar" style="width:${width}%"></div></div>
      </td>
      <td>${unavailable || stacks === 0 ? '—' : percent(incremental)}</td>
    </tr>`;
  }).join('');
}

levelInput.addEventListener('input', render);
typeInput.addEventListener('change', render);
render();
