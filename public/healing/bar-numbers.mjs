// Shared right-aligned numeric columns; preserve the surrounding UI typeface.
export function setBarNumbers(element, primary, secondary = '', separator = '·') {
  if (!element.classList.contains('meter-numbers') || element.children.length !== 3) {
    element.classList.add('meter-numbers');
    element.replaceChildren(...['meter-number-main','meter-number-separator','meter-number-detail'].map(name => {
      const cell = element.ownerDocument.createElement('span');
      cell.className = name;
      return cell;
    }));
  }
  const values = [String(primary), secondary ? separator : '', String(secondary)];
  values.forEach((value, i) => {
    if (element.children[i].textContent !== value) element.children[i].textContent = value;
  });
}
