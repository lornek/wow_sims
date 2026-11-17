import { armorByLevel } from './sunder-armor-data.mjs';

const ranks = [[10, 90], [22, 180], [34, 270], [46, 360], [58, 450]];
const levelInput = document.querySelector('#sunder-level');
const typeInput = document.querySelector('#sunder-type');
const levelValue = document.querySelector('#sunder-level-value');
const summary = document.querySelector('#sunder-summary');
const stackRows = document.querySelector('#sunder-stacks');
const hpInput = document.querySelector('#sunder-hp');
const dpsInput = document.querySelector('#sunder-dps');
const ttkStatus = document.querySelector('#sunder-ttk-status');
const ttkChart = document.querySelector('#sunder-ttk-chart');
const ttkRows = document.querySelector('#sunder-ttk-rows');
const number = new Intl.NumberFormat();
const percent = gain => (gain > 0 ? '+' : '') + gain.toFixed(2) + '%';

const stackInterval = 1.5;
const seconds = value => {
  const digits = value >= 1e6 || (value > 0 && value < 0.01)
    ? value.toExponential(2) : value.toFixed(2);
  return digits + ' s';
};

function timeToKill(baselineTime, stackLimit, multiplier) {
  let remaining = baselineTime;
  let elapsed = 0;

  // Measure remaining health in seconds of zero-stack DPS.
  for (let stacks = 1; stacks < stackLimit; stacks++) {
    const phase = remaining / multiplier(stacks);
    if (phase <= stackInterval) return elapsed + phase;
    remaining -= stackInterval * multiplier(stacks);
    elapsed += stackInterval;
  }

  return elapsed + remaining / multiplier(stackLimit);
}

function renderTimeToKill(rank, multiplier) {
  const hp = hpInput.valueAsNumber;
  const dps = dpsInput.valueAsNumber;
  const baselineTime = hp / dps;
  const valid = hp > 0 && dps > 0 && Number.isFinite(baselineTime) && baselineTime > 0;

  ttkChart.hidden = !valid;
  ttkStatus.textContent = !valid ? 'Enter positive HP and DPS values with a calculable kill time.' :
    rank < 0 ? 'Sunder Armor unlocks at level 10.' : '';
  if (!valid) return;

  ttkRows.innerHTML = Array.from({ length: rank < 0 ? 1 : 6 }, (_, limit) => {
    const time = timeToKill(baselineTime, limit, multiplier);
    const saved = Math.max(0, baselineTime - time);
    const width = 100 * (time / baselineTime);
    return `<tr>
      <th scope="row">${limit}</th>
      <td>${seconds(time)}
        <div class="progress" aria-hidden="true"><div class="progress-bar" style="width:${width}%"></div></div>
      </td>
      <td>${seconds(saved)}</td>
    </tr>`;
  }).join('');
}

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

  renderTimeToKill(rank, stacks => 1 + gain(armor, armorLeft(stacks)) / 100);
}

levelInput.addEventListener('input', render);
typeInput.addEventListener('change', render);
hpInput.addEventListener('input', render);
dpsInput.addEventListener('input', render);
render();
