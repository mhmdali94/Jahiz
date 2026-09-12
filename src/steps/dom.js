// Tiny DOM-builder helper — no framework, just less boilerplate than raw
// document.createElement everywhere. Used by every renderer in src/steps/.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value; // only ever used with our own static strings
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Renders "الاستضافة (Hosting)" with the Latin part smaller/lighter and forced LTR. */
export function labelWithLatinTerm(labelAr, latinTerm) {
  const wrap = el('span', { class: 'label-text' }, labelAr);
  if (latinTerm) {
    wrap.appendChild(document.createTextNode(' '));
    wrap.appendChild(el('span', { class: 'latin-term', dir: 'ltr' }, `(${latinTerm})`));
  }
  return wrap;
}
