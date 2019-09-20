import { PenInput } from '../pen-input/pen-input.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

var css = "#container .label-div{display:flex;justify-content:space-between;padding:var(--small-padding,4px)}";

var css$1 = "#container{display:flex;flex-direction:column}#container label{text-transform:capitalize;color:var(--dark-gray,#23282b);font-size:.75rem;opacity:.9;letter-spacing:.5px;display:block;margin-bottom:var(--padding-small,4px);position:relative;vertical-align:middle}#container input{border-radius:var(--radius-default,4px);background-image:none;box-shadow:none;font-size:1rem;height:var(--height-default,1rem);line-height:1.5;margin:0;padding:var(--padding-default,8px);border:2px solid var(--gray-default,#cfcccf);width:fit-content}#container input.input-error{border:2px solid var(--red-default,red)}#container input:disabled,#container input:read-only{cursor:not-allowed}";

class PenSsn extends PenInput {
  static get styles() {
    return [css, css$1];
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

export { PenSsn };
