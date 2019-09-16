import { PenBase } from '../utils/pen-base.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import styles from './pen-card.scss';

export class PenCard extends PenBase {
  static get styles() {
    return [styles];
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
