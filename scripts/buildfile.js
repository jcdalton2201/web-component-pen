/* eslint-disable prettier/prettier */
const globby = require('globby');
const fs = require('fs');

class BuildFiles {
  constructor() {
    const ignore = ['src/build.js','src/**/*.stories.js'];
    const files = globby.sync('src/**/*.js', { ignore });
    console.log(files);
    const file = 'src/build.js';
    const writeStream = fs.createWriteStream(file);
    const ctx = files
      .map(item => `import '${item.replace('src', '.')}';
`)
      .join('');
    writeStream.write(ctx);
  }
}

new BuildFiles();
