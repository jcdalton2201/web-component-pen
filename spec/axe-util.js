const chalk = require('chalk');
module.exports.isValid = function isValid(results) {
  results.violations.forEach(item => {
    const id = item.id;
    item.nodes.forEach(node => {
      const html = node.html;
      node.any.forEach(any => {
        console.log(
          `${any.impact} - ${chalk.magenta(
            'id:' + id
          )}: at location ${chalk.blue(html)}: ${chalk.red(any.message)}`
        );
      });
    });
  });
  return results.violations.length < 1;
};
