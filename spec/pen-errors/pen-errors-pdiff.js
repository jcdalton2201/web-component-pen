const Differencify = require('differencify');
const differencify = new Differencify({});
const difUtil = require('../diff-util.js');
describe('Unit and Functional Tests for pen-errors', () => {
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

  it('Test we can append a message', async () => {
    browser = difUtil.setTestName(differencify, 'Test we can append a message');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-errors></pen-errors>';
    }, bodyhandle);
    await page.waitForSelector('pen-errors');
    const text = await page.$eval('pen-errors', el => {
      el.appendErrorMessage({ message: 'we have an error', type: 'error' });
      const { errors } = el.refs;
      return errors.innerText;
    });
    expect(text).toEqual('we have an error');
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test we can set a message', async () => {
    browser = difUtil.setTestName(differencify, 'Test we can set a message');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-errors></pen-errors>';
    }, bodyhandle);
    await page.waitForSelector('pen-errors');
    const text = await page.$eval('pen-errors', el => {
      el.setErrorText('we set message');
      const { errors } = el.refs;
      return errors.innerText;
    });
    expect(text).toEqual('we set message');
  });
  it('Test we can handel a change', async () => {
    browser = difUtil.setTestName(differencify, 'Test we can handel a change');
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-errors></pen-errors>';
    }, bodyhandle);
    await page.waitForSelector('pen-errors');
    const text = await page.$eval('pen-errors', el => {
      el.describes = {
        validity: {
          patternMismatch: true,
        },
        classList: {
          remove: () => {},
          add: () => {},
        },
        setAttribute: () => {},
      };
      el.handleChange();
      const { errors } = el.refs;
      return errors.innerText;
    });
    expect(text).toEqual('This field does not follow the proper pattern');
  });
  it('Test we can change an error message', async () => {
    browser = difUtil.setTestName(
      differencify,
      'Test we can change an error message'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-errors></pen-errors>';
    }, bodyhandle);
    await page.waitForSelector('pen-errors');
    const text = await page.$eval('pen-errors', el => {
      el.setErrorMessage('patternMismatch', 'Why do we have dumb errors');
      el.describes = {
        validity: {
          patternMismatch: true,
        },
        classList: {
          remove: () => {},
          add: () => {},
        },
        setAttribute: () => {},
      };
      el.handleChange();
      const { errors } = el.refs;
      return errors.innerText;
    });
    expect(text).toEqual('Why do we have dumb errors');
  });
  it('Test we can change an set custom error', async () => {
    browser = difUtil.setTestName(
      differencify,
      'Test we can change an set custom error'
    );
    page = await difUtil.createPage(browser);
    const bodyhandle = await difUtil.createBodyHandle(page);
    await page.evaluate(element => {
      element.innerHTML = '<pen-errors></pen-errors>';
    }, bodyhandle);
    await page.waitForSelector('pen-errors');
    const text = await page.$eval('pen-errors', el => {
      el.describes = {
        validity: {
          customError: true,
        },
        classList: {
          remove: () => {},
          add: () => {},
        },
        setAttribute: () => {},
      };
      el.setCustomError('this is a second');
      const { errors } = el.refs;
      return errors.innerText;
    });
    expect(text).toEqual('this is a second');
  });
});
