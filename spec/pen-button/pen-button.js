// const puppeteer = require('puppeteer');

// describe('Unit and Functional Tests for pen-button', () => {
//   let browser = null;
//   let page = null;
//   //   let context = null;
//   //   let target = null;
//   beforeAll(async () => {
//     browser = await puppeteer.launch({ headless: true });
//     jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
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
//   it('Test we added button to the page', async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = '<pen-button>Test Button</pen-button>';
//     }, bodyhandle);
//     await page.waitForSelector('pen-button');
//     const text = await page.$eval('pen-button', el => el.innerText);
//     expect(text).toEqual('TEST BUTTON');
//   });
//   it('Test disable will not fire a submit', async () => {
//     const bodyhandle = await page.$('body');
//     await page.evaluate(element => {
//       element.innerHTML = `
//       <div id='myform'><form  action='' ><pen-button disabled>Test Button</pen-button></form></div><span></span>
// `;
//       element.querySelector('pen-button').addEventListener('click', () => {
//         const spanElement = document.querySelector('span');
//         spanElement.innerHTML = 'Success';
//         document.body.append(spanElement);
//       });
//     }, bodyhandle);
//     await page.waitForSelector('pen-button');
//     const text = await page.evaluate(() => {
//       return document
//         .querySelector('pen-button')
//         .shadowRoot.querySelector('button')
//         .getAttribute('disabled');
//     });
//     expect(text).toEqual('');
//     const success = await page.$eval('span', elem => elem.innerText);
//     expect(success).not.toEqual('Success');
//   });
//   it('Test we can listen to click event', async () => {
//     const bodyhandle = await page.$('body');
//     /*create the element with form */
//     let buttonElement = await page.evaluate(element => {
//       const formElement = document.createElement('form');
//       const buttonElement = document.createElement('pen-button');
//       buttonElement.innerText = 'Form Button';
//       formElement.append(buttonElement);
//       element.append(formElement);
//       buttonElement.addEventListener('click', () => {
//         const spanElement = document.createElement('span');
//         spanElement.innerHTML = 'Success';
//         document.body.append(spanElement);
//       });
//       return buttonElement;
//     }, bodyhandle);
//     /* spy on the element for fire*/
//     spyOn(buttonElement, '__onButtonClick');
//     await page.waitForSelector('pen-button');
//     /*click on the button*/
//     const button = await page.evaluateHandle(() => {
//       const x = document
//         .querySelector('pen-button')
//         .shadowRoot.querySelector('button');

//       return x;
//     });
//     await button.click();
//     const success = await page.$eval('span', elem => elem.innerText);
//     expect(success).toEqual('Success');
//   });
// });
