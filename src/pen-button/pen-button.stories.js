import { document, console } from 'global';
import '../../dist/pen-button/pen-button.js';
import readme from './readme.md';
export default {
  title: 'Button',
};

export const button = () => {
  const btn = document.createElement('pen-button');
  btn.type = 'button';
  btn.innerText = 'Hello Button';
  btn.addEventListener('click', e => console.log(e));
  return btn;
};

button.story = {
  name: 'button',
  parameters: {
    notes: readme,
  },
};
