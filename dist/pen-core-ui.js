/**
 * Transforms kebob case strings to camel case strings
 * @example
 * // returns 'myKebobCase'
 * kebobToCamelCase('my-kebob-case');
 * @param {string} _string - the kebob-case string to transform to camelCase
 * @returns {string}
 */
const kebobToCamelCase = _string => {
  // eslint-disable-next-line no-useless-escape
  return _string.replace(/(\-\w)/g, word => word[1].toUpperCase());
};

/**
 * Converts string boolean values to true booleans.
 * @param {string} value - the value to check its truthy
 * @param {string} attributeName - (optional) the elements attribute name to be compared with value
 * @return void
 */
const coerceBooleanValue = (value, attributeName) => {
  return (
    String(value) === 'true' || String(value) === '' || value === attributeName
  );
};

const renderSymbol = Symbol();
const stylesMap = new Map();
class PenBase extends HTMLElement {
  /**
   * Set initial value for boundAttributes
   * to bind attributes and properties together
   */
  static get boundAttributes() {
    return [];
  }

  /** Set default observed attributes to include boundAttributes */
  static get observedAttributes() {
    return [...this.boundAttributes];
  }

  /** Specify boolean attributes */
  static get booleanAttributes() {
    return [];
  }
  /**
   *
   * @param {Boolean} shadowRoot
   */
  constructor(shadowRoot = true) {
    super();
    if (shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    const styleSheets = stylesMap.get(this.tagName);
    const { styles } = this.constructor;
    if (styles && !styleSheets) {
      stylesMap.set(
        this.tagName,
        styles.map(styleText => {
          if ('adoptedStyleSheets' in document) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replace(styleText);
            return styleSheet;
          } else {
            return `<style>${styleText}</style>`;
          }
        })
      );
    }
    this.updatedCallbacksMap = new Map();
    /** Bind bound attribute keys to element properties */
    this.constructor.boundAttributes.forEach(attribute => {
      const property = kebobToCamelCase(attribute);

      Object.defineProperty(this, property, {
        get: () => {
          const value = this.getAttribute(attribute);
          if (this.constructor.booleanAttributes.includes(attribute)) {
            if (!value) {
              return false;
            } else {
              return true;
            }
          }
          return value;
        },
        set: value => {
          /** Do we need to fire the udpatedCallback? */
          const callbackNeeded = value === this[property];

          if (this.constructor.booleanAttributes.includes(attribute)) {
            if (value || value === '') {
              this.setAttribute(attribute, true);
            } else {
              this.removeAttribute(attribute);
            }
          } else {
            if (value) {
              this.setAttribute(attribute, value);
            } else {
              this.removeAttribute(attribute);
            }
          }

          /**
           * If an updated callback exists for this attribute,
           * call it from this call site
           */
          const updatedCallback = this.updatedCallbacksMap.get(attribute);
          if (
            updatedCallback &&
            typeof updatedCallback === 'function' &&
            callbackNeeded
          ) {
            updatedCallback.apply(this, [value, attribute]);
          }
        },
      });
    });
    /** Listeners */
    this._listeners = new Map();

    /** Refs */
    this.refs = {};

    /** Create a unique ID */
    // eslint-disable-next-line no-useless-escape
    this._uid = btoa(Math.floor(Math.random() * 1000000)).replace(/\=/gi, '');

    /** Save html */
    this[renderSymbol] = false;
  }

  /**
   * Attaches a click event handler if disabled is present. Ensures disabled components cannot emit click events
   * @return void
   */
  attachDisabledClickEventHandler() {
    if (this.constructor.observedAttributes.includes('disabled')) {
      this.on(
        'click',
        event => {
          if (this.disabled) {
            event.stopImmediatePropagation();
          }
        },
        true
      );
    }
  }

  /** Bind new attribute value to prop value for bound attributes */
  attributeChangedCallback(name, oldValue, newValue) {
    const property = kebobToCamelCase(name);
    let key = name;

    if (property !== name) {
      key = property;
    }

    if (
      newValue !== oldValue &&
      this.constructor.boundAttributes.includes(name)
    ) {
      // coerce the string values from strings to booleans
      if (this.constructor.booleanAttributes.includes(name)) {
        newValue = coerceBooleanValue(newValue, name);
        oldValue = coerceBooleanValue(oldValue, name);
      }

      if (
        newValue !== '' ||
        !this.constructor.booleanAttributes.includes(name)
      ) {
        this[key] = newValue;
      } else if (newValue === '' && this.hasAttribute(name)) {
        this[key] = true;
      } else if (!this.hasAttribute(name)) {
        this[key] = null;
      }
    }
  }

  /**
   * Bind method to this instance
   * @param {string} methodName
   * @return void
   */
  bindMethod(methodName) {
    this[methodName] = this[methodName].bind(this);
  }

  /**
   * Set up bindings
   * @param {Array<string>} methods - method names to bind
   * @return void
   */
  bindMethods(methods = []) {
    methods.forEach(method => (this[method] = this[method].bind(this)));
  }
  /**
   * set what should be called when attribute changes.
   * @param {String} refString refs name
   * @param {Function} callback Callback for the attribute change
   */
  boundAttributeCallback(refString, callback) {
    this.updatedCallbacksMap.set(refString, callback);
  }
  /**
   * build the ref map.
   */
  buildRefs() {
    if (this.root) {
      this.root.querySelectorAll('[data-ref]').forEach(ref => {
        this.refs[ref.dataset.ref] = ref;
      });
    }
  }
  /** Default connectedCallback */
  connectedCallback() {
    /** Save a reference to primary content as this.root */
    if (this.shadowRoot) {
      this.root = this.shadowRoot;
    } else {
      this.root = this;
    }

    /** Add styleSheets if possible */
    if (stylesMap.get(this.tagName) && 'adoptedStyleSheets' in document) {
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets = stylesMap.get(this.tagName);
      }
    }

    this.render();
    this.connected();
    this.upgradeProperties();
    this.attachDisabledClickEventHandler();
  }

  /** Default disconnectedCallback */
  disconnectedCallback() {
    this._listeners.forEach((callback, eventName) =>
      this.removeEventListener(eventName, callback)
    );
    this.disconnected();
  }

  /**
   * Construct and dispatch a new CustomEvent
   * that is composed (traverses shadow boundary)
   * and that bubbles
   * @param {string} name - Event name to emit
   * @param {any} detail - The detail property of the CustomEvent
   * @return void
   */
  emitEvent(name, detail) {
    const customEvent = new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(customEvent);
  }
  htmlLitStyle() {
    if (!('adoptedStyleSheets' in document) && stylesMap.get(this.tagName)) {
      return stylesMap.get(this.tagName).join('');
    }
    return null;
  }
  /**
   * Perform an action on event bubbling to this
   * @param {string} eventName
   * @param {function} callback
   * @return void
   */
  on(eventName, callback, options) {
    this._listeners.set(eventName, callback);
    this.addEventListener(eventName, callback, options);
  }
  /**
   * Rerender the html
   */
  rerender() {
    this[renderSymbol] = false;
    this.render();
  }

  /**
   * Reinitialize property now that the component is `alive` so that it can receive the set values.
   * @param {string} prop
   */
  upgradeProperty(prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  /**
   * This is a webcomponents best practice.
   * It captures the value from the unupgraded instance and reinitializes the property so it does not shadow the custom element's own property setter.
   * This way, when the element's definition does finally load, it can immediately reflect the correct state.
   */
  upgradeProperties() {
    this.constructor.observedAttributes.forEach(prop => {
      // eslint-disable-next-line no-prototype-builtins
      if (this.hasOwnProperty(prop)) {
        let value = this[prop];
        if (value) {
          this[prop] = value;
        }
      }
    });
  }

  /** Default methods so we don't need checks */
  connected() {}
  disconnected() {}
  render() {}
  postRender() {}
}

const defineElement = (tagName, elementClass, config) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass, config);
  } else {
    console.warn(`${tagName} has already been define.`);
  }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
/**
 * Brands a function as a directive factory function so that lit-html will call
 * the function during template rendering, rather than passing as a value.
 *
 * A _directive_ is a function that takes a Part as an argument. It has the
 * signature: `(part: Part) => void`.
 *
 * A directive _factory_ is a function that takes arguments for data and
 * configuration and returns a directive. Users of directive usually refer to
 * the directive factory as the directive. For example, "The repeat directive".
 *
 * Usually a template author will invoke a directive factory in their template
 * with relevant arguments, which will then return a directive function.
 *
 * Here's an example of using the `repeat()` directive factory that takes an
 * array and a function to render an item:
 *
 * ```js
 * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
 * ```
 *
 * When `repeat` is invoked, it returns a directive function that closes over
 * `items` and the template function. When the outer template is rendered, the
 * return directive function is called with the Part for the expression.
 * `repeat` then performs it's custom logic to render multiple items.
 *
 * @param f The directive factory function. Must be a function that returns a
 * function of the signature `(part: Part) => void`. The returned function will
 * be called with the part object.
 *
 * @example
 *
 * import {directive, html} from 'lit-html';
 *
 * const immutable = directive((v) => (part) => {
 *   if (part.value !== v) {
 *     part.setValue(v)
 *   }
 * });
 */
const directive = (f) => ((...args) => {
    const d = f(...args);
    directives.set(d, true);
    return d;
});
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = window.customElements !== undefined &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.removeChild(start);
        start = n;
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updateable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const nodesToRemove = [];
        const stack = [];
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        // Keeps track of the last index associated with a part. We try to delete
        // unnecessary nodes, but we never want to associate two different parts
        // to the same index. They must have a constant node between.
        let lastPartIndex = 0;
        let index = -1;
        let partIndex = 0;
        const { strings, values: { length } } = result;
        while (partIndex < length) {
            const node = walker.nextNode();
            if (node === null) {
                // We've exhausted the content inside a nested template element.
                // Because we still have parts (the outer for-loop), we know:
                // - There is a template in the stack
                // - The walker will find a nextNode outside the template
                walker.currentNode = stack.pop();
                continue;
            }
            index++;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes;
                    const { length } = attributes;
                    // Per
                    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                    // attributes are not guaranteed to be returned in document order.
                    // In particular, Edge/IE can return them out of order, so we cannot
                    // assume a correspondence between part index and attribute index.
                    let count = 0;
                    for (let i = 0; i < length; i++) {
                        if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                            count++;
                        }
                    }
                    while (count-- > 0) {
                        // Get the template literal section leading up to the first
                        // expression in this attribute
                        const stringForPart = strings[partIndex];
                        // Find the attribute name
                        const name = lastAttributeNameRegex.exec(stringForPart)[2];
                        // Find the corresponding attribute
                        // All bound attributes have had a suffix added in
                        // TemplateResult#getHTML to opt out of special attribute
                        // handling. To look up the attribute value we also need to add
                        // the suffix.
                        const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                        const attributeValue = node.getAttribute(attributeLookupName);
                        node.removeAttribute(attributeLookupName);
                        const statics = attributeValue.split(markerRegex);
                        this.parts.push({ type: 'attribute', index, name, strings: statics });
                        partIndex += statics.length - 1;
                    }
                }
                if (node.tagName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const data = node.data;
                if (data.indexOf(marker) >= 0) {
                    const parent = node.parentNode;
                    const strings = data.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    // Generate a new text node for each literal section
                    // These nodes are also used as the markers for node parts
                    for (let i = 0; i < lastIndex; i++) {
                        let insert;
                        let s = strings[i];
                        if (s === '') {
                            insert = createMarker();
                        }
                        else {
                            const match = lastAttributeNameRegex.exec(s);
                            if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                s = s.slice(0, match.index) + match[1] +
                                    match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                            }
                            insert = document.createTextNode(s);
                        }
                        parent.insertBefore(insert, node);
                        this.parts.push({ type: 'node', index: ++index });
                    }
                    // If there's no text, we must insert a comment to mark our place.
                    // Else, we can trust it will stick around after cloning.
                    if (strings[lastIndex] === '') {
                        parent.insertBefore(createMarker(), node);
                        nodesToRemove.push(node);
                    }
                    else {
                        node.data = strings[lastIndex];
                    }
                    // We have a part for each match found
                    partIndex += lastIndex;
                }
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                if (node.data === marker) {
                    const parent = node.parentNode;
                    // Add a new marker node to be the startNode of the Part if any of
                    // the following are true:
                    //  * We don't have a previousSibling
                    //  * The previousSibling is already the start of a previous part
                    if (node.previousSibling === null || index === lastPartIndex) {
                        index++;
                        parent.insertBefore(createMarker(), node);
                    }
                    lastPartIndex = index;
                    this.parts.push({ type: 'node', index });
                    // If we don't have a nextSibling, keep this node so we have an end.
                    // Else, we can remove it to save future costs.
                    if (node.nextSibling === null) {
                        node.data = '';
                    }
                    else {
                        nodesToRemove.push(node);
                        index--;
                    }
                    partIndex++;
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        // TODO (justinfagnani): consider whether it's even worth it to
                        // make bindings in comments work
                        this.parts.push({ type: 'node', index: -1 });
                        partIndex++;
                    }
                }
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
};
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this.__parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // There are a number of steps in the lifecycle of a template instance's
        // DOM fragment:
        //  1. Clone - create the instance fragment
        //  2. Adopt - adopt into the main document
        //  3. Process - find part markers and create parts
        //  4. Upgrade - upgrade custom elements
        //  5. Update - set node, attribute, property, etc., values
        //  6. Connect - connect to the document. Optional and outside of this
        //     method.
        //
        // We have a few constraints on the ordering of these steps:
        //  * We need to upgrade before updating, so that property values will pass
        //    through any property setters.
        //  * We would like to process before upgrading so that we're sure that the
        //    cloned fragment is inert and not disturbed by self-modifying DOM.
        //  * We want custom elements to upgrade even in disconnected fragments.
        //
        // Given these constraints, with full custom elements support we would
        // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
        //
        // But Safari dooes not implement CustomElementRegistry#upgrade, so we
        // can not implement that order and still have upgrade-before-update and
        // upgrade disconnected fragments. So we instead sacrifice the
        // process-before-upgrade constraint, since in Custom Elements v1 elements
        // must not modify their light DOM in the constructor. We still have issues
        // when co-existing with CEv0 elements like Polymer 1, and with polyfills
        // that don't strictly adhere to the no-modification rule because shadow
        // DOM, which may be created in the constructor, is emulated by being placed
        // in the light DOM.
        //
        // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
        // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
        // in one step.
        //
        // The Custom Elements v1 polyfill supports upgrade(), so the order when
        // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
        // Connect.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const stack = [];
        const parts = this.template.parts;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        let partIndex = 0;
        let nodeIndex = 0;
        let part;
        let node = walker.nextNode();
        // Loop through all the nodes and parts of a template
        while (partIndex < parts.length) {
            part = parts[partIndex];
            if (!isTemplatePartActive(part)) {
                this.__parts.push(undefined);
                partIndex++;
                continue;
            }
            // Progress the tree walker until we find our next part's node.
            // Note that multiple parts may share the same node (attribute parts
            // on a single element), so this loop may not run at all.
            while (nodeIndex < part.index) {
                nodeIndex++;
                if (node.nodeName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
                if ((node = walker.nextNode()) === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    node = walker.nextNode();
                }
            }
            // We've arrived at our part's node.
            if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);
                this.__parts.push(part);
            }
            else {
                this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
            }
            partIndex++;
        }
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isCommentBinding = false;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            // For each binding we want to determine the kind of marker to insert
            // into the template source before it's parsed by the browser's HTML
            // parser. The marker type is based on whether the expression is in an
            // attribute, text, or comment poisition.
            //   * For node-position bindings we insert a comment with the marker
            //     sentinel as its text content, like <!--{{lit-guid}}-->.
            //   * For attribute bindings we insert just the marker sentinel for the
            //     first binding, so that we support unquoted attribute bindings.
            //     Subsequent bindings can use a comment marker because multi-binding
            //     attributes must be quoted.
            //   * For comment bindings we insert just the marker sentinel so we don't
            //     close the comment.
            //
            // The following code scans the template source, but is *not* an HTML
            // parser. We don't need to track the tree structure of the HTML, only
            // whether a binding is inside a comment, and if not, if it appears to be
            // the first binding in an attribute.
            const commentOpen = s.lastIndexOf('<!--');
            // We're in comment position if we have a comment open with no following
            // comment close. Because <-- can appear in an attribute value there can
            // be false positives.
            isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                s.indexOf('-->', commentOpen + 1) === -1;
            // Check to see if we have an attribute-like sequence preceeding the
            // expression. This can match "name=value" like structures in text,
            // comments, and attribute values, so there can be false-positives.
            const attributeMatch = lastAttributeNameRegex.exec(s);
            if (attributeMatch === null) {
                // We're only in this branch if we don't have a attribute-like
                // preceeding sequence. For comments, this guards against unusual
                // attribute values like <div foo="<!--${'bar'}">. Cases like
                // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                // below.
                html += s + (isCommentBinding ? commentMarker : nodeMarker);
            }
            else {
                // For attributes we use just a marker sentinel, and also append a
                // $lit$ suffix to the name to opt-out of attribute-specific parsing
                // that IE and Edge do for style and certain SVG attributes.
                html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                    attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                    marker;
            }
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        template.innerHTML = this.getHTML();
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
const isIterable = (value) => {
    return Array.isArray(value) ||
        // tslint:disable-next-line:no-any
        !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attibute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = this.parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (isPrimitive(v) || !isIterable(v)) {
                    text += typeof v === 'string' ? v : String(v);
                }
                else {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
    constructor(committer) {
        this.value = undefined;
        this.committer = committer;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
    constructor(options) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.options = options;
    }
    /**
     * Appends this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part after the `ref` node (between `ref` and `ref`'s next
     * sibling). Both `ref` and its next sibling must be static, unchanging nodes
     * such as those that appear in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part.__insert(this.startNode = createMarker());
        part.__insert(this.endNode = createMarker());
    }
    /**
     * Inserts this part after the `ref` part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref.__insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        const value = this.__pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this.__commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this.__commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this.__commitNode(value);
        }
        else if (isIterable(value)) {
            this.__commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this.__commitText(value);
        }
    }
    __insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this.__insert(value);
        this.value = value;
    }
    __commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        // If `value` isn't already a string, we explicitly convert it here in case
        // it can't be implicitly converted - i.e. it's a symbol.
        const valueAsString = typeof value === 'string' ? value : String(value);
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = valueAsString;
        }
        else {
            this.__commitNode(document.createTextNode(valueAsString));
        }
        this.value = value;
    }
    __commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this.__commitNode(fragment);
            this.value = instance;
        }
    }
    __commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const value = !!this.__pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // tslint:disable-next-line:no-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the thrid
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
try {
    const options = {
        get capture() {
            eventOptionsSupported = true;
            return false;
        }
    };
    // tslint:disable-next-line:no-any
    window.addEventListener('test', options, options);
    // tslint:disable-next-line:no-any
    window.removeEventListener('test', options, options);
}
catch (_e) {
}
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const newListener = this.__pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        if (shouldAddListener) {
            this.__options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        this.value = newListener;
        this.__pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const committer = new PropertyCommitter(element, name.slice(1), strings);
            return committer.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const committer = new AttributeCommitter(element, name, strings);
        return committer.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.1.2');
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// For each part, remember the value that was last rendered to the part by the
// unsafeHTML directive, and the DocumentFragment that was last set as a value.
// The DocumentFragment is used as a unique key to check if the last value
// rendered to the part was with unsafeHTML. If not, we'll always re-render the
// value passed to unsafeHTML.
const previousValues = new WeakMap();
/**
 * Renders the result as HTML, rather than text.
 *
 * Note, this is unsafe to use with any user-provided input that hasn't been
 * sanitized or escaped, as it may lead to cross-site-scripting
 * vulnerabilities.
 */
const unsafeHTML = directive((value) => (part) => {
    if (!(part instanceof NodePart)) {
        throw new Error('unsafeHTML can only be used in text bindings');
    }
    const previousValue = previousValues.get(part);
    if (previousValue !== undefined && isPrimitive(value) &&
        value === previousValue.value && part.value === previousValue.fragment) {
        return;
    }
    const template = document.createElement('template');
    template.innerHTML = value; // innerHTML casts to string internally
    const fragment = document.importNode(template.content, true);
    part.setValue(fragment);
    previousValues.set(part, { value, fragment });
});

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

var css = "button{align-items:center;display:flex;justify-content:center;position:relative;flex-flow:column;min-width:88px;box-sizing:border-box;cursor:pointer;font-size:1.25rem;font-weight:400;height:2.25rem;line-height:2.25rem;text-align:center;white-space:nowrap;color:var(--white-color,#fff);border-radius:var(--radius-default,4px);text-transform:uppercase;text-decoration:none;margin:0;padding:0 1rem;border-width:0;width:fit-content;background-color:var(--main-color,#007ecc)}button,button:hover{transition:all .4s ease 0s}button:hover{background:var(--main-43,#434343);letter-spacing:1px;box-shadow:0 5px 5px -3px rgba(0,0,0,.2),0 8px 10px 1px rgba(0,0,0,.14),0 3px 14px 2px rgba(0,0,0,.12)}button[disabled]{opacity:.4;cursor:not-allowed}button:active{box-shadow:0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12);transition:all .4s ease 0s;border-color:#000}";

class PenButton extends PenBase {
  static get styles() {
    return [css];
  }
  static get boundAttributes() {
    return ['disabled', 'loading', 'size', 'type', 'color'];
  }
  static get booleanAttributes() {
    return ['disabled', 'loading'];
  }

  constructor() {
    super();
    // eslint-disable-next-line no-unused-vars
    this.baseTemplate = style =>
      html`
        ${unsafeHTML(style)}
        <button
          class="${this.variant} ${this.size === 'small' ? 'small' : ''}"
          data-ref="button"
        >
          <slot></slot>
        </button>
      `;
    /** Set up listeners */
    this.bindMethods(['_linkButton', '__onButtonClick', '__onFormSubmit']);
    this._previousType = 'none';
  }
  connected() {
    const { button } = this.refs;
    this.form = findParentForm(this);
    this.type === this.type || 'submit';
    if (this.form) {
      button.setAttribute('type', 'submit');
      button.addEventListener('click', this.__onButtonClick);
      this.form.addEventListener('submit', this.__onFormSubmit);
    }
    this.constructor.boundAttributes.forEach(attribute =>
      this.updatedCallbacksMap.set(attribute, this._linkButton)
    );
  }

  disconnected() {
    const { button } = this.refs;
    super.disconnected();
    button.removeEventListener('click', this.submitForm);
  }
  render() {
    render(this.baseTemplate(this.htmlLitStyle()), this.root);
    this.buildRefs();
  }
  /**
   * Submits a form if one is present
   */
  submitForm() {
    if (!this.disabled) {
      console.log('he hey ehy');
      const submitEvent = new Event('submit');
      this.form.dispatchEvent(submitEvent);
      this.form._penSubmit = true;
    }
  }

  /**
   * Keep properties in sync between `this` and the button
   * @param {any} value - The value to link to button prop
   * @param {string} prop - The prop name to link
   */
  _linkButton(value, prop) {
    const { button } = this.refs;
    if (button) {
      if (prop === 'color') {
        button.style['background-color'] = value;
      }
      if (prop === 'size') {
        button.classList.toggle('small', value === 'small');
      }

      if (prop === 'disabled' || prop === 'type') {
        button[prop] = value;
      }

      if (prop === 'loading') {
        if (value) {
          button.style.width = window.getComputedStyle(button).width;
        } else {
          button.removeAttribute('style');
        }
        button.classList.toggle('loading', value);
        this.disabled = value;
      }
    }
  }

  /**
   * Handle button click event
   * @param {Event} event
   */
  __onButtonClick(event = {}) {
    const triggerEvent =
      this.form && !this.disabled && event && !event.defaultPrevented;
    /** This is to give external listeners time to call preventDefault */
    setTimeout(() => {
      if (triggerEvent && this.type !== 'reset') {
        this.submitForm();
      } else if (triggerEvent && this.type === 'reset') {
        this.form.reset();
      }
    });
  }

  /**
   * If the form is submitted by this button
   * and not prevented, submit the form
   * @param {Event} event - submit event
   */
  __onFormSubmit(event) {
    if (
      !event.isTrusted &&
      event.target._penSubmit &&
      !event.defaultPrevented
    ) {
      event.target.submit();
    }
    delete event.target._penSubmit;
  }
}
defineElement('pen-button', PenButton);

var css$1 = "article{display:flex;justify-content:center;padding:var(--padding-default,8px);box-shadow:0 0 0 0 rgba(0,0,0,.2),0 0 0 0 rgba(0,0,0,.14),0 0 0 0 rgba(0,0,0,.12)}article.z4{box-shadow:0 2px 2px 0 rgba(0,0,0,.2),0 4px 2px 1px rgba(0,0,0,.14),0 1px 4px 1px rgba(0,0,0,.12)}article.z8{box-shadow:0 5px 5px -3px rgba(0,0,0,.2),0 8px 10px 1px rgba(0,0,0,.14),0 3px 14px 2px rgba(0,0,0,.12)}article.z16{box-shadow:0 8px 10px -5px rgba(0,0,0,.2),0 16px 24px 2px rgba(0,0,0,.14),0 6px 30px 5px rgba(0,0,0,.12)}";

class PenCard extends PenBase {
  static get styles() {
    return [css$1];
  }
  static get boundAttributes() {
    return ['elevation'];
  }
  static get booleanAttributes() {
    return [];
  }

  constructor() {
    super();
    // eslint-disable-next-line no-unused-vars
    this.baseTemplate = style =>
      html`
      ${unsafeHTML(style)}
        <article id="container" data-ref='container'>
          <slot></slot>
        </acticle>
      `;
    this.bindMethods(['_updateElevation']);
  }
  connected() {
    this.updatedCallbacksMap.set('elevation', this._updateElevation);
  }

  render() {
    render(this.baseTemplate(this.htmlLitStyle()), this.root);
    this.buildRefs();
  }
  _updateElevation(value) {
    const { container } = this.refs;
    container.classList = '';
    switch (value) {
      case '1':
        container.classList.add('z4');
        break;
      case '2':
        container.classList.add('z8');
        break;
      case '3':
        container.classList.add('z16');
        break;
      default:
        break;
    }
  }
}
defineElement('pen-card', PenCard);

var css$2 = ".error{color:red;font-size:.75rem;height:1rem;padding:var(--padding-small,4px)}";

class PenErrors extends PenBase {
  static get styles() {
    return [css$2];
  }
  static get boundAttributes() {
    return ['id'];
  }
  static get booleanAttributes() {
    return [];
  }

  constructor() {
    super();
    this._invalidClass = 'input-error';
    // eslint-disable-next-line no-unused-vars
    this.baseTemplate = style => html`
    ${unsafeHTML(style)}
    <div class='error' data-ref='errors'></div<>`;
    this.validityMessages = new Map([
      ['customError', this._generateMessage(100, 'This field is invalid')],
      ['badInput', this._generateMessage(4, 'This field is invalid')],
      [
        'patternMismatch',
        this._generateMessage(
          9,
          'This field does not follow the proper pattern'
        ),
      ],
      [
        'rangeOverflow',
        this._generateMessage(
          8,
          'The value does not fit in the necessary range'
        ),
      ],
      [
        'stepMismatch',
        this._generateMessage(7, 'The value is not a valid step'),
      ],
      ['tooLong', this._generateMessage(6, 'The value is too long')],
      ['tooShort', this._generateMessage(6, 'The value is too short')],
      [
        'typeMismatch',
        this._generateMessage(5, 'The entered value is not the right format'),
      ],
      ['valueMissing', this._generateMessage(10, 'This field is required')],
    ]);
    this._inputs = [];
    this.validators = this.validators || [];
    this.bindMethods([
      '_onIdChange',
      'handleChange',
      'handleReset',
      '_onDescribesInput',
      '_inputInvalid',
      '_inputValid',
    ]);
    // this.updatedCallbacks.set('id', this._onIdChange);
  }
  connected() {
    /** Initialize the element */
    this._onIdChange(this.id);
    this._addEventListeners();
    /** Append helper text */
    this.validityMessages.has('valid') &&
      this.appendErrorMessage(this.validityMessages.get('valid'));
  }
  disconnected() {
    if (this.describes) {
      this.describes.removeEventListener('change', this.handleChange);
      this.describes.removeEventListener('input', this._onDescribesInput);
      this.describes.removeEventListener('blur', this.handleChange);
    } else if (this._inputs.length) {
      this._inputs.forEach(input => {
        input.removeEventListener('change', this.handleChange);
        input.removeEventListener('input', this._onDescribesInput);
        input.removeEventListener('blur', this.handleChange);
      });
    }
    this.form && this.form.removeEventListener('submit', this.handleChange);
    this._inputs.length = 0;
  }
  render() {
    render(this.baseTemplate(this.htmlLitStyle()), this.root);
    this.buildRefs();
  }
  appendErrorMessage(message) {
    const { errors } = this.refs;
    if (errors) {
      errors.innerHTML = '';
      if (message && message.message) {
        const helperEl = document.createElement('span');
        helperEl.classList.add(message.type);
        helperEl.innerHTML = message.message;
        errors.appendChild(helperEl);
      }
    }
  }
  connectInput(input) {
    this._addEventListeners(input);
    this._inputs.push(input);
    if (input.type === 'radio') {
      this._invalidClass = 'radio-error';
    }
  }
  handleChange(event = {}) {
    /** Prevent form submission if invalid */
    console.log(this._inputs);
    const describesInvalid =
      this.describes &&
      this.describes.validity &&
      this.describes.validity.valid === false;
    const inputsInvalid = describesInvalid;
    const isInvalid = describesInvalid || inputsInvalid;
    if (this.form === event.target && event.type === 'submit' && isInvalid) {
      event.preventDefault();
    }
    let validity = {};
    if (this.describes) {
      validity = this.describes.validity;
    } else if (this._inputs[0]) {
      validity = this._inputs[0].validity;
    }
    if (!validity) {
      validity = this._inputs[0].validity;
    }
    const validityKeys = [];
    this.validityMessages.forEach((value, key) => validityKeys.push(key));
    const errors = validityKeys
      .filter(errorKey => validity[errorKey])
      .map(errorKey => this.validityMessages.get(errorKey))
      .reduce((current, next) => {
        return current.priority > next.priority ? current : next;
      }, {});

    this.appendErrorMessage(errors);

    if (this.describes) {
      if (validity.valid === false) {
        this._inputInvalid(this.describes);
      } else {
        this._inputValid(this.describes);
      }
    } else if (this._inputs.length) {
      if (validity.valid === false) {
        this._inputs.forEach(this._inputInvalid);
      } else {
        this._inputs.forEach(this._inputValid);
      }
    }
  }
  handleReset() {
    const { errors } = this.refs;
    const { describes } = this;
    if (errors) {
      errors.innerHTML = '';
      describes.classList.remove(this._invalidClass);
      if (this.validityMessages.get('valid')) {
        this.appendErrorMessage(this.validityMessages.get('valid'));
      }
    }
  }
  setCustomError(message) {
    const customError = this.validityMessages.get('customError');
    customError ? (customError.message = message) : null;
    this.handleChange();
  }
  setErrorMessage(key, message) {
    this.validityMessages.get(key).message = message;
    return this.validityMessages.get(key).message;
  }
  setErrorText(message) {
    this.validityMessages.set(
      'valid',
      this._generateMessage(10, message, 'helper')
    );
    const helper = this.validityMessages.get('valid');
    this.appendErrorMessage(helper);
  }
  _addEventListeners(input) {
    input = input || this.describes;
    if (input) {
      input.addEventListener('change', this.handleChange);
      input.addEventListener('blur', this.handleChange);
      input.addEventListener('input', this._onDescribesInput);
      if (this.form) {
        this.form.addEventListener('submit', this.handleChange, true);
        this.form.addEventListener('reset', this.handleReset, true);
      }
    }
  }
  get form() {
    this._form = this._form || findParentForm(this);
    return this._form;
  }
  _inputInvalid(input) {
    input.classList.add(this._invalidClass);
    input.setAttribute('aria-invalid', true);
  }
  _inputValid(input) {
    input.classList.remove(this._invalidClass);
    input.setAttribute('aria-invalid', false);
  }
  _onIdChange(value) {
    const selector = `[aria-describedby~="${value}"]`;

    if (this.parentNode && this.parentNode.host) {
      this.describes = this.parentNode.host.shadowRoot.querySelector(selector);
    } else if (this.parentNode) {
      this.describes = this.parentNode.querySelector(selector);
    }
    if (this.describes) {
      this._invalidClass =
        {
          checkbox: 'checkbox-error',
          textarea: 'textarea-error',
        }[this.describes.type] || 'input-error';

      if (this.describes.tagName === 'SELECT') {
        this._invalidClass = 'select-error';
      }

      if (this.describes.dataset.helperText) {
        this.setErrorText(this.describes.dataset.helperText);
      } else {
        setTimeout(() => {
          this.setErrorText(this.innerHTML);
        });
      }
    }
  }
  _generateMessage(priority, message, type = 'error') {
    return { priority, message, type };
  }
  _onDescribesInput() {
    if (this.shadowRoot.querySelector('.error')) {
      this.appendErrorMessage(this.validityMessages.get('valid'));
      if (this.describes) {
        this.describes.classList.remove(this._invalidClass);
      } else {
        this._inputs.forEach(input =>
          input.classList.remove(this._invalidClass)
        );
      }
    }
  }
}
defineElement('pen-errors', PenErrors);

class PenInputBase extends PenBase {
  static get boundAttributes() {
    return [];
  }
  static get booleanAttributes() {
    return [];
  }

  constructor(inputRef = 'input', errorRef = 'errors') {
    super();
    this._inputRef = inputRef;
    this._errorRef = errorRef;
    this.bindMethods(['setErrorMessage', 'setCustomValidity', '__onFormReset']);
    const { form } = this;
    this.on('keydown', event => {
      if (form && event.code === 'Enter') {
        form.dispatchEvent(new CustomEvent('submit'));
      }
    });

    if (form) {
      form.addEventListener('reset', this.__onFormReset);
    }
  }
  /**
   * proxy the checkValidity from input.
   */
  get checkValidity() {
    const input = this.ref(this._inputRef);
    return input.checkValidity.bind(input);
  }
  /**
   * get the parent form.
   */
  get form() {
    this._form = this._form || findParentForm(this);
    return this._form;
  }
  /**
   * proxy the validity from the input.
   */
  get validity() {
    const input = this.ref(this._inputRef);
    return input ? input.validity : {};
  }
  /**
   * Proxy input validationMessage
   */
  get validationMessage() {
    const input = this.ref(this._inputRef);
    return input ? input.validationMessage : null;
  }

  /**
   * Proxy input willValidate
   *
   */
  get willValidate() {
    const input = this.ref(this._inputRef);
    return input ? input.willValidate : null;
  }

  /** Proxy input blur */
  blur() {
    const input = this.ref(this._inputRef);
    input ? input.blur() : null;
  }

  /** Proxy input click */
  click() {
    const input = this.ref(this._inputRef);
    input ? input.click() : null;
  }

  /** Proxy input focus */
  focus() {
    const input = this.ref(this._inputRef);
    input ? input.focus() : null;
  }
  /**
   * Change the default error message
   * @param {string} key - The key of the error message
   * @param {string} message - The new error message
   * @return {string} - The new error message
   */
  setErrorMessage(key, message) {
    const error = this.ref(this._errorRef);
    return error
      ? this.ref(this._errorRef).setErrorMessage(key, message)
      : null;
  }
  /**
   * Set custom error message
   * @param {String} message
   */
  setCustomValidity(message = '') {
    const input = this.ref(this._inputRef);
    const error = this.ref(this._errorRef);
    if (!message) {
      message = '';
    }
    input ? input.setCustomValidity(message) : null;
    error ? error.setCustomError(message) : null;
  }
  /**
   * Set the element's helper text
   * @param {string} value - Helper text
   */
  setError(value) {
    if (this.ref(this._errorRef)) {
      this.ref(this._errorRef).setHelperText(value);
    }
  }

  /**
   * Reset the value when the form is reset
   */
  __onFormReset() {
    this.value = '';
  }
}
defineElement('pen-input-base', PenInputBase);

var css$3 = "#container{display:flex;flex-direction:column}#container label{text-transform:capitalize;color:var(--dark-gray,#23282b);font-size:.75rem;opacity:.9;letter-spacing:.5px;display:block;margin-bottom:var(--padding-small,4px);position:relative;vertical-align:middle}#container input{border-radius:var(--radius-default,4px);background-image:none;box-shadow:none;font-size:1rem;height:var(--height-default,1rem);line-height:1.5;margin:0;padding:var(--padding-default,8px);border:2px solid var(--gray-default,#cfcccf);width:fit-content}#container input.input-error{border:2px solid var(--red-default,red)}#container input:disabled,#container input:read-only{cursor:not-allowed}";

/* eslint-disable no-useless-escape */
class PenInput extends PenInputBase {
  static get styles() {
    return [css$3];
  }
  static get boundAttributes() {
    return [
      'disabled',
      'required',
      'minlength',
      'maxlength',
      'readonly',
      'autocomplete',
      'autofocus',
      'tooltip',
      'pattern',
      'min',
      'max',
      'value',
      'placeholder',
      'size',
      'compact',
      'helper',
      'error-message',
      'counter',
      'step',
      'id',
      'title',
    ];
  }
  static get booleanAttributes() {
    return [
      'disabled',
      'required',
      'readonly',
      'autofocus',
      'compact',
      'counter',
    ];
  }

  constructor(inputType = 'text') {
    super();
    this._id =
      this.id || btoa(Math.floor(Math.random() * 1000000)).replace(/\=/gi, '');
    this._inputType = inputType;
    // eslint-disable-next-line no-unused-vars
    this.baseTemplate = style => html`
      ${unsafeHTML(style)}
      <div id="container">
        <label data-ref="label" for="${this._id}"><slot></slot></label>
        <input data-ref="input" id="${this._id}" />
        <pen-errors data-ref="errors"></pen-errors>
      </div>
    `;
    this.bindMethods(['_onInputInput', '_linkInput', '_setCharacterCount']);
    this._inputAttributes = [
      'disabled',
      'required',
      'minlength',
      'maxlength',
      'readonly',
      'autocomplete',
      'autofocus',
      'pattern',
      'min',
      'max',
      'placeholder',
      'size',
      'step',
    ];
    this._inputAttributes.forEach(attribute => {
      this.updatedCallbacksMap.set(attribute, this._linkInput);
    });
    this.updatedCallbacksMap.set('value', this._setValue);
    this.updatedCallbacksMap.set('tooltip', this.setHelper);
    this.updatedCallbacksMap.set('compact', this._toggleInputClass);
    this.updatedCallbacksMap.set('helper', this.setHelper);
    this.updatedCallbacksMap.set('error-message', this.setCustomValidity);
    this.updatedCallbacksMap.set('counter', this._setCharacterCount);
  }
  connected() {
    const { input } = this.refs;
    input.addEventListener('input', this._onInputInput);
    // Initialize input
    this._inputAttributes.forEach(attribute => {
      this[attribute] ? this._linkInput(this[attribute], attribute) : null;
    });
  }

  disconnected() {
    this.refs.input.removeEventListener('input', this._onInputInput);
  }
  render() {
    render(this.baseTemplate(this.htmlLitStyle()), this.root);
    this.buildRefs();
    const { errors, input } = this.refs;
    errors.connectInput(input);
  }
  _setValue(_value) {
    const { input, counter } = this.refs;
    if (input && input.value !== _value) {
      input.value = _value;
    }
    if (this.counter && counter) {
      counter.count = (_value && _value.length) || '0';
    }
    this.emitEvent('pen-change', _value);
  }
  /**
   * Link input and `this` properties and values
   * @param {any} value - The new value for the property
   * @param {sring} prop - The property name to link between this and input
   */
  _linkInput(value, prop) {
    const { input, label } = this.refs;

    if (label) {
      switch (prop) {
        case 'disabled':
          if (value) {
            label.classList.add('disabled');
          } else {
            label.classList.remove('disabled');
          }
          break;
        case 'id':
          this._id = value;
          label.setAttriubte('for', value);
          break;
        default:
          break;
      }
    }

    if (input) {
      if (!value) {
        input.removeAttribute(prop);
      } else if (prop === 'minlength') {
        input.minLength = value;
      } else if (prop === 'maxlength') {
        input.maxLength = value;
      } else if (prop === 'readonly') {
        input.readOnly = value;
      } else {
        input[prop] = value;
      }
    }
  }
  /**
   *
   * @param {Boolean} isVisible
   */
  _setCharacterCount(isVisible) {
    const { counter } = this.refs;
    if (counter && this.maxlength) {
      counter.hidden = !isVisible;
      Promise.resolve().then(() => (counter.max = this.maxlength));
    }
  }
  /**
   *
   * @param {Event} event
   */
  _onInputInput(event) {
    this.value = event.target.value;
  }
  /**
   * Toggle a class on input
   * @param {boolean} value - set the class
   * @param {string} prop - class to set
   */
  _toggleInputClass(value, prop) {
    const { input } = this.refs;
    if (input) {
      input.classList.toggle(prop, value);
    }
  }
}
defineElement('pen-input', PenInput);

var css$4 = "#container .label-div{display:flex;justify-content:space-between;padding:var(--small-padding,4px)}";

class PenSsn extends PenInput {
  static get styles() {
    return [css$4, css$3];
  }
  constructor() {
    super();
    // eslint-disable-next-line no-unused-vars
    this.baseTemplate = style => html`
      ${unsafeHTML(style)}
      <div id="container">
        <div class="label-div" data-ref="labelDiv">
          <label data-ref="label" for="${this._id}"><slot></slot></label>
          <button class="toggle-button" data-ref="toggleButton">Hide</button>
        </div>
        <input data-ref="input" id="${this._id}" />
        <pen-errors data-ref="errors"></pen-errors>
      </div>
    `;
    this.bindMethods([
      '_inputKeydown',
      '_inputInput',
      '_toggleButtonText',
      '_addMask',
      '_toggleClick',
      '_inputPaste',
      '_inputBlur',
      '_inputFocus',
      '_setValue',
    ]);
    this.maskedValue = '';
    this.unmaskedValue = '';
    this._obfuscatedValue = '';
    this._isDelete;
    this.updatedCallbacksMap.delete('value');
  }
  connected() {
    super.connected();
    const { input, labelDiv } = this.refs;
    const size = input.getBoundingClientRect();
    labelDiv.style.width = `${size.width - 4}px`;
    this._init();
    this.autocomplete = 'off';
  }
  disconnected() {
    super.disconnected();
    const { input, toggleButton } = this.refs;
    input.removeEventListener('keydown', this._inputKeydown);
    input.removeEventListener('input', this._inputInput);
    toggleButton.removeEventListener('click', this._toggleClick);
    input.removeEventListener('paste', this._inputPaste);
  }
  render() {
    render(this.baseTemplate(this.htmlLitStyle()), this.root);
    this.buildRefs();
    const { errors, input } = this.refs;
    this._addListeners();
    errors.connectInput(input);
  }
  get maskState() {
    return this.getAttribute('mask-state') || 'hidden';
  }
  set maskState(_maskState) {
    const { input } = this.refs;
    if ((_maskState && _maskState === 'visible') || _maskState === 'hidden') {
      this.setAttribute('mask-state', _maskState);
      if (this.maskState === 'visible') {
        input.value = this.maskedValue || '';
      } else {
        input.value = this._obfuscatedValue;
      }
    } else {
      this.maskState = 'hidden';
    }
  }
  /** Get the value from the value attribute */
  get value() {
    console.log('heelo');
    return this.getAttribute('value');
  }

  /** When the value changes, make sure the emit events and set up masks */
  set value(_value) {
    console.log(_value);
    const value = this._unmask(_value.toString());
    value ? this.setAttribute('value', value) : this.removeAttribute(value);
    this.emitEvent('pen-change', _value);
    this.refs.input.value = this._addMask(value);
  }

  /**
   * Adding the Event Listerners for this elements.
   */
  _addListeners() {
    const { input, toggleButton } = this.refs;
    input.addEventListener('keydown', this._inputKeydown);
    input.addEventListener('input', this._inputInput);
    input.addEventListener('paste', this._inputPaste);
    input.addEventListener('blur', this._inputBlur);
    input.addEventListener('focus', this._inputFocus);
    toggleButton.addEventListener('click', this._toggleClick);
  }
  /**
   * Initlaize this elements.
   */
  _init() {
    this.hasValidation = true;
    this.maskState = 'hidden';
    this._placeholder = '___-__-____';
    // this.pattern = "^\d{3}-\d{2}-\d{4}$";
    this.minlength = 11;
    this.maxlength = 11;
    this._toggleButtonText();
  }
  /**
   * Handel the input event.
   * @param {Event} event Input event HTMLEvent
   *
   */
  _inputInput(event) {
    if (!event.inputType && this._isDelete) {
      event.inputType = 'deleteContentBackward';
    }
    if (event.inputType !== 'deleteContentBackward') {
      this._parseAddition(event);
    } else {
      this._parseDeletion(event);
    }
  }
  /**
   * handel the keydow event for the input.
   * @param {Event} event keydown event
   */
  _inputKeydown(event) {
    const deleteKeys = [8, 64];
    const { key } = event;
    const { input } = this.refs;
    const { selectionStart } = input;
    this._isDelete = deleteKeys.includes(event.keyCode);
    this._cachedValue = this.unmaskedValue || '';
    this._cachedSelection = selectionStart;
    if (key.match(/[0-9]$/)) {
      input.value = '';
    } else if (key.toString().includes('Arrow')) {
      setTimeout(() => {
        this._cachedSelection = input.selectionStart;
      }, 1);
    }
  }
  /**
   * Handel the blur event.
   */
  _inputBlur() {
    const { input } = this.refs;
    input.setCustomValidity('');
    console.log(this.unmaskedValue.length);
    if (this.unmaskedValue.length < 9) {
      input.setCustomValidity(
        'This field does not follow the proper pattern 123-12-1234'
      );
    }
    if (input.value === this._placeholder) {
      input.value = '';
    }
  }
  /**
   * Handel the focus event.
   */
  _inputFocus() {
    setTimeout(() => {
      const { input } = this.refs;
      if (input.value === '') {
        input.setSelectionRange(0, 0);
      } else {
        const firstPlaceholder = input.value.indexOf('_');
        input.setSelectionRange(firstPlaceholder, firstPlaceholder);
      }
    });
  }
  /**
   * Adding the mask value ***-**-*** for ssn.
   * @param {String} value Inpuu value
   */
  _addMask(value = '') {
    const placeholderCharacter = '_';
    const unmaskedValue = this._unmask(value);
    const firstThree = unmaskedValue
      .slice(0, 3)
      .padEnd(3, placeholderCharacter);
    const secondTwo = unmaskedValue.slice(3, 5).padEnd(2, placeholderCharacter);
    const lastFour = unmaskedValue.slice(5, 9).padEnd(4, placeholderCharacter);

    let maskedValue = '';
    if (firstThree.length === 3) {
      maskedValue += `${firstThree}-`;
    } else {
      maskedValue += firstThree;
    }
    if (secondTwo.length === 2) {
      maskedValue += `${secondTwo}-`;
    } else {
      maskedValue += secondTwo;
    }

    maskedValue += lastFour;

    this.maskedValue = maskedValue;
    return maskedValue;
  }

  /**
   * Manage cursor location when some event happens
   * @param {string} maskedValue - The masked value
   * @param {number} selectionStart - The current cursor location
   * @param {Event} event - Some event
   */
  _manageCursor(maskedValue, selectionStart, event = {}) {
    if (selectionStart >= 3 && selectionStart < 5) {
      selectionStart += 1;
    } else if (selectionStart >= 5) {
      selectionStart += 2;
    }

    if (event.inputType === 'deleteContentBackward') {
      selectionStart = this._cachedSelection - 1;
    }

    this.refs.input.setSelectionRange(selectionStart, selectionStart);
  }

  /**
   * Obfuscate the input value
   * @param {string} value - Value to obfuscate
   * @return {Promise<string>} - The masked value
   */
  _obfuscate(value = '') {
    const obfuscation = new Promise(resolve => {
      const { input } = this.refs;
      let obfuscatedValue =
        value.slice(0, 7).replace(/[0-9]/g, '•') + value.slice(7, 12);
      this._obfuscatedValue = obfuscatedValue;
      this.value = this.unmaskedValue.slice(0, 9);
      if (this.maskState === 'visible') {
        input.value = value;
      } else {
        input.value = this._obfuscatedValue;
      }
      resolve(this.maskedValue);
    });
    return obfuscation;
  }

  /** Manage addition to the mask */
  _parseAddition(event = {}) {
    const oldValue = this._addMask(this._cachedValue);
    const newValue = this._unmask(
      oldValue.slice(0, this._cachedSelection) +
        this.refs.input.value +
        oldValue.slice(this._cachedSelection)
    );
    this._mask(newValue, event);
  }

  /** Mange a delete event */
  _parseDeletion(event) {
    const maskedValue = this._addMask(this._cachedValue);
    const value = this._unmask(
      `${maskedValue.slice(0, this._cachedSelection - 1)}${maskedValue.slice(
        this._cachedSelection
      )}`
    );
    this._mask(value, event);
  }

  /** Switch the button text dependent on mask state */
  _toggleButtonText() {
    const { toggleButton } = this.refs;
    if (this.maskState === 'hidden') {
      toggleButton.innerHTML = 'Show';
    } else if (this.maskState === 'visible') {
      toggleButton.innerHTML = 'Hide';
    }
  }

  /**
   * mask the ssn number
   * @param {String} value value to mask
   * @param {Event} event The event that had fired this function
   */
  _mask(value = '', event = {}) {
    const unmaskedValue = this._unmask(value);
    const maskedValue = this._addMask(unmaskedValue);
    const isDelete = event.inputType === 'deleteContentBackward';
    this.unmaskedValue = unmaskedValue;
    this.maskedValue = maskedValue;

    this._obfuscate(maskedValue).then(maskedValue => {
      const start = isDelete ? this._cachedSelection : unmaskedValue.length;
      this._manageCursor(maskedValue, start, event);
      this._isDelete = undefined;
    });
  }

  /**
   * show the value
   * @param {String} value
   */
  _unmask(value = '') {
    return value.replace(/\D/g, '').slice(0, 9);
  }
  /**
   * Handel the value getting pasted into the element.
   * @param {Event} event Paste Event
   */
  _inputPaste(event) {
    const pastedValue = event.clipboardData.getData('text/plain');
    this._mask(pastedValue);
  }

  /**
   * Toggle the visuality of the input value.
   */
  _toggleClick() {
    const { input } = this.refs;
    if (this.maskState === 'visible') {
      this.maskState = 'hidden';
      input.value = this._obfuscatedValue;
    } else {
      this.maskState = 'visible';
      input.value = this.maskedValue;
    }
    this._toggleButtonText();
  }
}
defineElement('pen-ssn', PenSsn);
//# sourceMappingURL=pen-core-ui.js.map
