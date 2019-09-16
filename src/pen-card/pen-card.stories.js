import { document, console } from 'global';
import '../../dist/pen-card/pen-card.js';
import readme from './readme.md';
import { withKnobs, radios } from '@storybook/addon-knobs';
export default {
  title: 'Card',
  decorators: [withKnobs],
};
const label = 'Elevation';
const options = {
  none: '0',
  one: '1',
  two: '2',
  three: '3',
};
const defaultValue = '0';
const groupId = 'GROUP-ID1';
export const card = () => {
  const card = document.createElement('pen-card');
  card.type = 'card';
  const value = radios(label, options, defaultValue, groupId);
  card.elevation = value;
  card.innerText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 
  ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi 
  ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum 
  dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
  console.log(value);
  return card;
};

card.story = {
  name: 'card',
  parameters: {
    notes: readme,
  },
};
