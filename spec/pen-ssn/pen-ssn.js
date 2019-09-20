const difUtil = require('../diff-util.js');
// const { AxePuppeteer } = require('axe-puppeteer');
// const AxeUtil = require('../axe-util.js');
describe('Unit and Functional Tests for pen-ssn', () => {
  
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

  it('Test we can add an ssn field', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(differencify, 'Test we can add an ssn field');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-ssn name="test" id="test">First Name</pen-ssn></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-ssn');
    const text = await page.$eval('pen-ssn', el => {
      return el.innerText;
    });
    expect(text).toEqual('First Name');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can type in ssn field', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we can type in ssn field'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-ssn name="test" id="test">First Name</pen-ssn></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-ssn');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-ssn').root.querySelector('input');
    }, bodyhandle);
    await text.type('123456789');
    const value = await page.$eval('pen-ssn', el => {
      return el.value;
    });
    expect(value).toEqual('123456789');
    await page.waitFor(1000);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can type and show ssn field', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we can type and show ssn field'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-ssn name="test" id="test">First Name</pen-ssn></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-ssn');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-ssn').root.querySelector('input');
    }, bodyhandle);
    await text.type('123456789');
    const value = await page.$eval('pen-ssn', el => {
      return el.value;
    });
    expect(value).toEqual('123456789');
    await page.waitFor(1000);
    const button = await page.evaluateHandle(body => {
      return body.querySelector('pen-ssn').root.querySelector('button');
    }, bodyhandle);
    button.click();
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
});
