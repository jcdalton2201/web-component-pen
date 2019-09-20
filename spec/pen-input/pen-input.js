const difUtil = require('../diff-util.js');
const { AxePuppeteer } = require('axe-puppeteer');
const AxeUtil = require('../axe-util.js');
describe('Unit and Functional Tests for pen-input', () => {
  
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

  it('Test we can add an input field', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we can add an input field'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test">First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.$eval('pen-input', el => {
      return el.innerText;
    });
    expect(text).toEqual('First Name');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can type in input field', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we can type in input field'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test">First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-input').root.querySelector('input');
    }, bodyhandle);
    await text.type('Hello');
    const value = await page.$eval('pen-input', el => {
      return el.value;
    });
    expect(value).toEqual('Hello');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we show error on required out', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we show error on required outd'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" required>First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-input').root.querySelector('input');
    }, bodyhandle);
    await text.press('Enter');
    const value = await page.$eval('pen-input', el => {
      const elementErrors = el.refs['errors'];
      const { errors } = elementErrors.refs;
      return errors.innerText;
    });
    expect(value).toEqual('This field is required');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can set the max length', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we can set the max length'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" maxlength="5">First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-input').root.querySelector('input');
    }, bodyhandle);
    await text.type('123456');
    const value = await page.$eval('pen-input', el => {
      return el.value;
    });
    expect(value).toEqual('12345');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can set the min length', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(
      differencify,
      'Test we can set the min length'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" minlength="5">First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-input').root.querySelector('input');
    }, bodyhandle);
    await text.type('1234');
    await text.press('Enter');
    const value = await page.$eval('pen-input', el => {
      return el.value;
    });
    const error = await page.$eval('pen-input', el => {
      const elementErrors = el.refs['errors'];
      const { errors } = elementErrors.refs;
      return errors.innerText;
    });
    expect(value).toEqual('1234');
    expect(error).toEqual('The value is too short');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can set the pattern', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(differencify, 'Test we can set the pattern');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" pattern="[a-z]{4,8}">First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-input').root.querySelector('input');
    }, bodyhandle);
    await text.type('1234');
    await text.press('Enter');
    const error = await page.$eval('pen-input', el => {
      const elementErrors = el.refs['errors'];
      const { errors } = elementErrors.refs;
      return errors.innerText;
    });
    expect(error).toEqual('This field does not follow the proper pattern');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can set the readonly', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(differencify, 'Test we can set the readonly');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" value="12345" readonly>First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const text = await page.evaluateHandle(body => {
      return body.querySelector('pen-input').root.querySelector('input');
    }, bodyhandle);
    await text.type('test');
    const value = await page.$eval('pen-input', el => {
      return el.value;
    });
    expect(value).toEqual('12345');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can set the size', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = difUtil.setTestName(differencify, 'Test we can set the size');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" size="3" >First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const value = await page.$eval('pen-input', el => {
      return el.size;
    });
    expect(value).toEqual('3');
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
      element.innerHTML =
        '<form action="#"><pen-input name="test" id="test" size="3" >First Name</pen-input></form>';
    }, bodyhandle);
    await page.waitForSelector('pen-input');
    const results = await new AxePuppeteer(page).include('form').analyze();
    expect(AxeUtil.isValid(results)).toBeTruthy();
  });
});
