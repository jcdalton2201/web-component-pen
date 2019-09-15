/**
 * This function takes in a node and will
 * call itself recursively with the element's
 * parent node until a form `HTMLFormElement` is found
 * @param {HTMLElement} elem
 * @return {HTMLElement || null}
 */
const findParentForm = elem => {
  let parent = elem.parentNode;
  if (parent && parent.tagName !== 'FORM') {
    parent = findParentForm(parent);
  } else if (!parent && elem.toString() === '[object ShadowRoot]') {
    parent = findParentForm(elem.host);
  }
  return parent;
};

export { findParentForm };
