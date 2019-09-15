import { configure, addParameters, addDecorator } from '@storybook/html';
// import {withNotes} from  '@storybook/addon-notes';

// addDecorator(withNotes);
// automatically import all files ending in *.stories.js
configure(require.context('../src', true, /\.stories\.js$/), module);

