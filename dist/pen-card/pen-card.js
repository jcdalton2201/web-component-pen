import { PenBase } from '../utils/pen-base.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

var css = "article{display:flex;justify-content:center;padding:var(--padding-default,8px);box-shadow:0 0 0 0 rgba(0,0,0,.2),0 0 0 0 rgba(0,0,0,.14),0 0 0 0 rgba(0,0,0,.12)}article.z4{box-shadow:0 2px 2px 0 rgba(0,0,0,.2),0 4px 2px 1px rgba(0,0,0,.14),0 1px 4px 1px rgba(0,0,0,.12)}article.z8{box-shadow:0 5px 5px -3px rgba(0,0,0,.2),0 8px 10px 1px rgba(0,0,0,.14),0 3px 14px 2px rgba(0,0,0,.12)}article.z16{box-shadow:0 8px 10px -5px rgba(0,0,0,.2),0 16px 24px 2px rgba(0,0,0,.14),0 6px 30px 5px rgba(0,0,0,.12)}";

class PenCard extends PenBase {
  static get styles() {
    return [css];
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

export { PenCard };
