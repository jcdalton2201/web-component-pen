import { PenBase } from '../utils/pen-base.js';
import { defineElement } from '../utils/define-element.js';
// import { html, render } from 'lit-html';
import { findParentForm } from '../utils/find-parent-form.js';
export class PenInputBase extends PenBase {
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
