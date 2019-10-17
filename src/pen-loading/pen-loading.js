import { PenBase } from '../utils/pen-base.js';
import { defineElement } from '../utils/define-element.js';
import { html, render } from 'lit-html';
import styles from './pen-loading.scss';
export class PenLoading extends PenBase {
  static get styles() {
    return [styles];
  }
  static get boundAttributes() {
    return ['width', 'full'];
  }
  static get booleanAttributes() {
    return ['full'];
  }

  constructor() {
    super();
    this.isReset = {
      wave: false,
      wave2: false,
    };
    this.maxFrequency = 8;
    this.maxAmplitude = 150;
    this.minAmplitude = 50;
    this.bindMethods([
      '__initPoints',
      'cycle',
      '__random',
      '_setWidth',
      '_setFullSize',
    ]);
    this.wave = {
      amplitude: this.__random(this.maxAmplitude, this.minAmplitude),
      frequency: this.__random(this.maxFrequency),
      points: [],
    };
    this.wave.points.length = 500;
    this.wave.points.fill(0, 0);
    // eslint-disable-next-line no-unused-vars
    this.baseTemplate = style => html`
      <div data-ref="container">
        <svg data-ref="loader" viewBox="0 -100 800 200">
          <g>
            <line id="line" x1="0" x2="100%" />
            <path id="wave" data-ref="wave" />
            <path id="wave2" data-ref="wave2" />
          </g>
        </svg>
      </div>
    `;
    this.updatedCallbacksMap.set('width', this._setWidth);
    this.updatedCallbacksMap.set('full', this._setFullSize);
  }
  /**
   *
   * @param {String} line animation cycle
   */
  cycle(line) {
    const conture = this.__random(4, 0);
    if (this.isReset[line]) {
      let stringPath = 'M 0,0 ';
      this.wave.frequency = this.__random(this.maxFrequency);
      this.wave.amplitude = this.__random(this.maxAmplitude, this.minAmplitude);
      this.wave.points.forEach((item, index) => {
        item.ratio = this._getRatio(index, conture);
        const y = item.update(this.wave.frequency, this.wave.amplitude);
        stringPath = `${stringPath} L ${index * (800 / 500)} ${y}`;
      });
      this.refs[line].setAttribute('d', stringPath);
    } else {
      let stringPath = 'M 0,0 ';
      this.wave.points.forEach((item, index) => {
        stringPath = `${stringPath} L ${index * (800 / 500)} 0`;
      });
      this.refs[line].setAttribute('d', stringPath);
    }
    this.isReset[line] = !this.isReset[line];
    const offset = 500 + this.__random(500, 0);
    setTimeout(() => {
      this.cycle(line);
    }, offset);
  }
  render() {
    render(this.baseTemplate(this.htmlLitStyle()), this.root);
    this.buildRefs();
    this.__initPoints();
    setTimeout(() => {
      this.cycle('wave');
    }, 500 + this.__random(500, 0));
    setTimeout(() => {
      this.cycle('wave2');
    }, 500 + this.__random(500, 0));
  }
  /**
   * initalized the waves
   */
  __initPoints() {
    const { wave, wave2 } = this.refs;
    let stringPath = 'M 0,0 ';
    const conture = this.__random(4, 0);
    this.wave.points.forEach((item, index) => {
      const period = index / 500;
      stringPath = `${stringPath} L ${index * (800 / 500)} 0`;
      this.wave.points[index] = {
        ratio: this._getRatio(index, conture),
        period: period,

        update: function(frequency, amplitude) {
          var cycle = Math.sin(this.period * frequency * Math.PI * 2);
          var height = (this.ratio * amplitude) / 2;
          return cycle * height;
        },
      };
    });
    wave.setAttribute('d', stringPath);
    wave2.setAttribute('d', stringPath);
  }
  /**
   *
   * @param {int} index what of the 500 are we on
   * @param {int} conture where the mid point is
   */
  _getRatio(index, conture = 0) {
    if (conture === 0) {
      return 1;
    }
    const max = 500;
    const mid = max / conture;
    if (index <= mid) {
      return index / mid;
    }
    return (max - index) / (max - mid);
  }
  /**
   *
   * @param {int} max top level for the numbers
   */
  __random(max, min = 1) {
    const num = Math.round(Math.random() * max) + min;
    return num;
  }
  _setWidth() {
    this.refs['loader'].style.width = this.getAttribute('width');
  }
  _setFullSize() {
    if (this.hasAttribute('full')) {
      this.refs['container'].classList.add('full');
    } else {
      this.refs['container'].classList.remove('full');
    }
  }
}
defineElement('pen-loading', PenLoading);
