const difUtil = require('../diff-util.js');
const { AxePuppeteer } = require('axe-puppeteer');
const AxeUtil = require('../axe-util.js');
describe('Unit and Functional Tests for pen-loading', () => {
  let browser = null;
  let page = null;
  beforeAll(async () => {});
  afterEach(async () => {
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = '';
    }, bodyhandle);
    await page.close();
    await browser.close();
  });
  afterAll(async () => {});
  it('Test We can see our loading screen full size', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test We can see our loading screen full size'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-loading full></pen-loading>';
    }, bodyhandle);
    await page.waitForSelector('pen-loading');
    await page.waitFor(500);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test accessibility of the element', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test accessibility of the element'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-loading full></pen-loading>';
    }, bodyhandle);
    await page.waitForSelector('pen-loading');
    const results = await new AxePuppeteer(page)
      .include('pen-loading')
      .analyze();
    expect(AxeUtil.isValid(results)).toBeTruthy();
  });
});
