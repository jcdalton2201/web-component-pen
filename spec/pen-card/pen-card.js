// const puppeteer = require('puppeteer');
// describe('Unit and Functional Tests for pen-card', () => {
//   let browser = null;
//   let page = null;
//   //   let context = null;
//   //   let target = null;
//   beforeAll(async () => {
//     browser = await puppeteer.launch({ headless: true });
//     jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
//     page = await browser.newPage();
//     await page.setBypassCSP(true);
//     // await page.goto('http://localhost:8080');
//     await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
//   });
//   afterEach(async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = '';
//     }, bodyhandle);
//   });
//   afterAll(async () => {
//     await page.close();
//     await browser.close();
//   });
//   it('Test we set the inner card', async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = '<pen-card>Test Card</pen-card>';
//     }, bodyhandle);
//     await page.waitForSelector('pen-card');
//     const text = await page.$eval('pen-card', el => el.innerText);
//     expect(text).toEqual('Test Card');
//   });
//   it('Test we can set the elevation to 1', async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = '<pen-card elevation="1">Test Card</pen-card>';
//     }, bodyhandle);
//     await page.waitForSelector('pen-card');
//     const text = await page.$eval(
//       'pen-card',
//       el => el.refs['container'].classList
//     );
//     expect(text[0]).toEqual('z4');
//   });
//   it('Test we can set the elevation to 2', async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = '<pen-card elevation="2">Test Card</pen-card>';
//     }, bodyhandle);
//     await page.waitForSelector('pen-card');
//     const text = await page.$eval(
//       'pen-card',
//       el => el.refs['container'].classList
//     );
//     expect(text[0]).toEqual('z8');
//   });
//   it('Test we can set the elevation to 3', async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = '<pen-card elevation="3">Test Card</pen-card>';
//     }, bodyhandle);
//     await page.waitForSelector('pen-card');
//     const text = await page.$eval(
//       'pen-card',
//       el => el.refs['container'].classList
//     );
//     expect(text[0]).toEqual('z16');
//   });
// });
