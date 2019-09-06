import { PenBase } from '../utils/pen-base.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { findParentForm } from '../utils/find-parent-form.js';
// eslint-disable-next-line no-unused-vars
import styles from './pen-button.scss';
export class PenButton extends PenBase {
  static get styles() {
    return [styles];
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
      const submitEvent = new Event('submit');
      this.form.dispatchEvent(submitEvent);
      this.form._inkSubmit = true;
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
      event.target._inkSubmit &&
      !event.defaultPrevented
    ) {
      event.target.submit();
    }
    delete event.target._inkSubmit;
  }
}
defineElement('pen-button', PenButton);
