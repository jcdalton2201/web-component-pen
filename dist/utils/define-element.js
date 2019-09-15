const defineElement = (tagName, elementClass, config) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass, config);
  } else {
    console.warn(`${tagName} has already been define.`);
  }
};

export { defineElement };
