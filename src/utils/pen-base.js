import { kebobToCamelCase } from './string-utils.js';
import { coerceBooleanValue } from './coerce-boolean-value.js';
const renderSymbol = Symbol();
const stylesMap = new Map();
export class PenBase extends HTMLElement {
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
