import { PenBase } from '../utils/pen-base.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import { findParentForm } from '../utils/find-parent-form.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import styles from './pen-errors.scss';
export class PenErrors extends PenBase {
  static get styles() {
    return [styles];
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
