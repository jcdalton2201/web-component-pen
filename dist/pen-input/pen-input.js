import { PenInputBase } from '../pen-input-base/pen-input-base.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import '../pen-errors/pen-errors.js';

var css = "#container{display:flex;flex-direction:column}#container label{text-transform:capitalize;color:var(--dark-gray,#23282b);font-size:.75rem;opacity:.9;letter-spacing:.5px;display:block;margin-bottom:var(--padding-small,4px);position:relative;vertical-align:middle}#container input{border-radius:var(--radius-default,4px);background-image:none;box-shadow:none;font-size:1rem;height:var(--height-default,1rem);line-height:1.5;margin:0;padding:var(--padding-default,8px);border:2px solid var(--gray-default,#cfcccf);width:fit-content}#container input.input-error{border:2px solid var(--red-default,red)}#container input:disabled,#container input:read-only{cursor:not-allowed}";

/* eslint-disable no-useless-escape */
class PenInput extends PenInputBase {
  static get styles() {
    return [css];
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

export { PenInput };
