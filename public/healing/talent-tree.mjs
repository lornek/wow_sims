import {attachGameTooltip, tooltipLine} from './game-ui.mjs';
import {trees} from './talent-data.mjs';

export const pointCap = 51;
export const totalPoints = (build, nodes = trees.flatMap(tree => tree.nodes)) =>
  nodes.reduce((sum, node) => sum + (build[node.name] ?? 0), 0);

function unlocked(build, tree, node) {
  const previous = tree.nodes.filter(other => other.row < node.row);
  const parent = tree.nodes.find(other => other.name === node.requires);
  return totalPoints(build, previous) >= (node.row - 1) * 5 &&
    (!parent || build[parent.name] === parent.max);
}

export function changeTalent(build, tree, node, delta, treeList = trees) {
  const current = build[node.name] ?? 0;
  if (delta > 0 && !unlocked(build, tree, node)) return build;
  const rank = Math.min(node.max, Math.max(0, current + delta), current + pointCap - totalPoints(build, treeList.flatMap(entry => entry.nodes)));
  if (rank === current) return build;
  const next = {...build, [node.name]: rank};
  return tree.nodes.every(other => !next[other.name] || unlocked(next, tree, other)) ? next : build;
}

export function restoreBuild(saved, treeList = trees) {
  let build = {};
  for (const tree of treeList) {
    for (const node of [...tree.nodes].sort((a, b) => a.row - b.row)) {
      const rank = saved?.[node.name];
      if (Number.isInteger(rank) && rank > 0) build = changeTalent(build, tree, node, rank, treeList);
    }
  }
  return build;
}

export function mountTalentTree(container, initial, onChange, treeList = trees) {
  let build = restoreBuild(initial, treeList);
  let locked = false;
  const toolbar = document.createElement('div');
  toolbar.className = 'talent-toolbar';
  const total = document.createElement('strong');
  total.setAttribute('aria-live', 'polite');
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Reset all';
  reset.onclick = () => setBuild({});
  toolbar.append(total, reset);
  const board = document.createElement('div');
  board.className = 'talent-board';
  const cards = treeList.map(tree => {
    const card = document.createElement('section');
    card.className = 'talent-tree';
    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = tree.name;
    const count = document.createElement('output');
    const resetTree = document.createElement('button');
    resetTree.type = 'button';
    resetTree.textContent = 'Reset';
    resetTree.setAttribute('aria-label', 'Reset ' + tree.name);
    resetTree.onclick = () => {
      const next = {...build};
      for (const node of tree.nodes) delete next[node.name];
      setBuild(next);
    };
    header.append(title, count, resetTree);
    const grid = document.createElement('div');
    grid.className = 'talent-grid ' + tree.slug;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 700');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    grid.append(svg);
    const nodes = tree.nodes.map(node => {
      if (node.requires) {
        const parent = tree.nodes.find(other => other.name === node.requires);
        if (parent) {
          const arrow = document.createElementNS(svg.namespaceURI, 'path');
          const x = (node.column - .5) * 100;
          const y = (node.row - .5) * 100;
          const px = (parent.column - .5) * 100;
          const py = (parent.row - .5) * 100;
          arrow.setAttribute('d', 'M' + px + ' ' + py + ' V' + (y - 45) + ' H' + x + ' V' + (y - 22));
          svg.append(arrow);
        }
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'talent-node';
      button.style.gridArea = node.row + ' / ' + node.column;
      const image = document.createElement('img');
      image.src = new URL('./icons/' + node.icon + '.jpg', import.meta.url);
      image.alt = '';
      image.draggable = false;
      const badge = document.createElement('span');
      button.append(image, badge);
      const change = delta => {
        if (!locked) setBuild(changeTalent(build, tree, node, delta, treeList));
      };
      button.onclick = event => change(event.shiftKey ? node.max : 1);
      button.oncontextmenu = event => { event.preventDefault(); change(-1); };
      button.onkeydown = event => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          change(-1);
        }
      };
      const tooltip = attachGameTooltip(button, tip => {
        tip.replaceChildren();
        tooltipLine(tip, node.name, 'game-tooltip-title');
        tooltipLine(tip, 'Rank ' + (build[node.name] ?? 0) + ' / ' + node.max);
        for (const description of node.description) tooltipLine(tip, description, 'game-tooltip-description');
        if (node.row > 1) tooltipLine(tip, 'Requires ' + ((node.row - 1) * 5) + ' points in ' + tree.name,
          unlocked(build, tree, node) ? '' : 'game-tooltip-locked');
        if (node.requires) tooltipLine(tip, 'Requires max rank in ' + node.requires);
        tooltipLine(tip, 'Click to learn · Right-click to remove', 'game-tooltip-good');
      });
      grid.append(button);
      return {node, button, badge, tooltip};
    });
    card.append(header, grid);
    board.append(card);
    return {tree, count, resetTree, nodes};
  });
  container.replaceChildren(toolbar, board);

  function render() {
    const spent = totalPoints(build, treeList.flatMap(entry => entry.nodes));
    total.textContent = (pointCap - spent) + ' points left · ' + cards.map(({tree}) => totalPoints(build, tree.nodes)).join(' / ');
    reset.disabled = locked || !spent;
    for (const {tree, count, resetTree, nodes} of cards) {
      const used = totalPoints(build, tree.nodes);
      count.textContent = used;
      resetTree.disabled = locked || !used;
      for (const {node, button, badge, tooltip} of nodes) {
        const rank = build[node.name] ?? 0;
        const available = unlocked(build, tree, node);
        badge.textContent = rank + '/' + node.max;
        button.dataset.state = rank === node.max ? 'max' : rank ? 'spent' : available ? 'available' : 'locked';
        button.setAttribute('aria-label', node.name + ', ' + rank + ' of ' + node.max);
        tooltip.refresh();
      }
    }
  }

  function setBuild(next) {
    if (next === build) return;
    build = next;
    render();
    onChange();
  }
  render();
  return {get build() { return build; }, setLocked(value) {
    if (locked === value) return;
    locked = value;
    render();
  }};
}
