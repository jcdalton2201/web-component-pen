const chalk = require('chalk');
const mkdirp = require('mkdirp');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

class CreateComponent {
  constructor() {
    if (argv.name) {
      let paths = argv.name.split('/');
      let name = argv.name;
      let dir = '';
      if (paths.length > 1) {
        name = paths.pop();
        dir = `/${paths.join('/')}`;
      }
      console.log(
        chalk.green(
          `We are going to build component ${name} in dir ${chalk.yellow(dir)}`
        )
      );
      this._buildDir(name, dir);
      this._buildJs(name, dir);
      this._buildSpec(name, dir);
    } else {
      console.log(chalk.red('Please add the argument --name=<<name>>'));
    }
  }
  /**
   * This will convert slug string to Camel Cased
   * @param {String} val value of string to change
   */
  __camelCased(val) {
    return val
      .toLocaleLowerCase()
      .split('-')
      .map(item => item.replace(/^./, c => c.toLocaleUpperCase()))
      .join('');
  }
  /**
   *
   * @param {String} name
   * @param {String} dir
   */
  _buildDir(name, dir) {
    mkdirp.sync(`src${dir}/pen-${name}`);
    mkdirp.sync(`spec${dir}/pen-${name}`);
    console.log(chalk.green(`we have created a directory at src/pen-${name}`));
  }
  /**
   *
   * @param {String} name
   * @param {String} dir
   */
  _buildJs(name, dir) {
    const file = `src${dir}/pen-${name}/pen-${name}.js`;
    const writeStream = fs.createWriteStream(file);
    writeStream.write(`
import {PenBase} from '../utils/pen-base.js';
import {defineElement} from '../utils/define-element.js';
import {html, render} from 'lit-html';
export class Pen${this.__camelCased(name)} extends PenBase {
    static get boundAttributes() {return [];}
    static get booleanAttributes() {return [];}

    constructor(){
        super();
        // eslint-disable-next-line no-unused-vars
        this.baseTemplate = (style) => html\` \`;
    }

    render(){
        render(this.baseTemplate(this.htmlLitStyle()),this.root);
    }
}
defineElement('pen-${name}',Pen${this.__camelCased(name)});
`);
  }
  /**
   * This will build a Puppetter tests.
   * @param {String} name
   * @param {String} dir
   */
  _buildSpec(name, dir) {
    const file = `spec${dir}/pen-${name}/pen-${name}.js`;
    const writeStream = fs.createWriteStream(file);
    writeStream.write(`
const puppeteer = require('puppeteer');
describe('Unit and Functional Tests for pen-${name}',()=>{
    let browser = null;
    let page = null;
    let context = null;
    let target = null;
    beforeAll(async() => {
        browser = await puppeteer.launch({headless:false});
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
        page = await browser.newPage();
        await page.setBypassCSP(true);
        await page.goto('http://localhost:8080');
        await page.addScriptTag({path:'dist/pen-core-ui.js'});

    });
    it('Test we can work',async()=>{

    });
});
`);
  }
}
new CreateComponent();
