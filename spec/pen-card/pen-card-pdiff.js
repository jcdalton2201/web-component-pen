describe('Visual regression Tests for pen-card', () => {
  let browser = null;
  let page = null;
  beforeAll(async () => {});
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

  it('Test default elevations', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = differencify.init({
      testName: 'Test default elevation',
      chain: false,
      headless: true,
    });
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    await browser.launch();
    page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1600, height: 1200 });
    // await page.goto('http://localhost:8080');
    await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <pen-card>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
        ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </pen-card>
  `;
    }, bodyhandle);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test elevations 1', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = differencify.init({
      testName: 'Test elevation 1',
      chain: false,
      headless: true,
    });
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    await browser.launch();
    page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1600, height: 1200 });
    // await page.goto('http://localhost:8080');
    await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <pen-card elevation="1">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
        ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </pen-card>
  `;
    }, bodyhandle);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test elevations 2', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = differencify.init({
      testName: 'Test elevation 2',
      chain: false,
      headless: true,
    });
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    await browser.launch();
    page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1600, height: 1200 });
    // await page.goto('http://localhost:8080');
    await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <pen-card elevation="2">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
        ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </pen-card>
  `;
    }, bodyhandle);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
  it('Test elevations 3', async () => {
    const Differencify = require('differencify');
    const differencify = new Differencify({});
    browser = differencify.init({
      testName: 'Test elevation 3',
      chain: false,
      headless: true,
    });
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    await browser.launch();
    page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({ width: 1600, height: 1200 });
    // await page.goto('http://localhost:8080');
    await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
    const bodyhandle = await page.$('body');
    await page.evaluate(element => {
      element.innerHTML = `
        <pen-card elevation="3">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
        ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
        ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </pen-card>
  `;
    }, bodyhandle);
    const image = await page.screenshot();
    const result = await browser.toMatchSnapshot(image);
    expect(result).toBeTruthy();
  });
});
