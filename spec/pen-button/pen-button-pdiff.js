// const puppeteer = require('puppeteer');
const Differencify = require('differencify');
const differencify = new Differencify({});
describe('Visual regression Tests for pen-button', () => {
  let browser = null;
  let page = null;
  //   let context = null;
  //   let target = null;
  beforeAll(async () => {
    browser = differencify.init({ chain: false, headless: false });
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    await browser.launch();
    page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1600, height: 1200 });
    // await page.goto('http://localhost:8080');
    await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
  });
  afterEach(async () => {
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = '';
    }, bodyhandle);
  });
  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  it('Test default color', async () => {
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <div id='myform'><form  action='' ><pen-button >Test Button</pen-button></form></div><span></span>
  `;
      element.querySelector('pen-button').addEventListener('click', () => {
        const spanElement = document.querySelector('span');
        spanElement.innerHTML = 'Success';
        document.body.append(spanElement);
      });
    }, bodyhandle);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test a diffrent color', async () => {
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <div id='myform'><form><pen-button color='green'>Test Button</pen-button></form></div><span></span>
  `;
      element.querySelector('pen-button').addEventListener('click', () => {
        const spanElement = document.querySelector('span');
        spanElement.innerHTML = 'Success';
        document.body.append(spanElement);
      });
    }, bodyhandle);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test a hover color', async () => {
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <div id='myform'><form><pen-button >Test Button</pen-button></form></div><span></span>
  `;
      element.querySelector('pen-button').addEventListener('click', () => {
        const spanElement = document.querySelector('span');
        spanElement.innerHTML = 'Success';
        document.body.append(spanElement);
      });
    }, bodyhandle);
    const button = await page.evaluateHandle(() => {
      const x = document
        .querySelector('pen-button')
        .shadowRoot.querySelector('button');

      return x;
    });
    await button.hover();
    await page.waitFor(2000);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
});
