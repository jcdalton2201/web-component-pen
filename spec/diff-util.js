module.exports.setTestName = function setTestName(differencify, name) {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  return differencify.init({
    testName: name,
    chain: false,
    headless: true,
  });
};
module.exports.createPage = async function createPage(browser) {
  await browser.launch();
  return await browser.newPage();
};

module.exports.createBodyHandle = async function createBodyHandle(page) {
  await page.setBypassCSP(true);
  await page.setViewport({ width: 1600, height: 1200 });
  await page.addScriptTag({ path: 'dist/pen-core-ui.js' });
  return await page.$('body');
};
