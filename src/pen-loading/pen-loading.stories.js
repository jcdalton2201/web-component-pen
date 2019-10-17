import { document } from 'global';
import '../../dist/pen-loading/pen-loading.js';
import readme from './readme.md';
import { withKnobs, boolean } from '@storybook/addon-knobs';
export default {
  title: 'Loading',
  decorators: [withKnobs],
};
const label = 'Full Screen?';

const defaultValue = false;
const groupId = 'GROUP-ID1';
export const card = () => {
  const card = document.createElement('pen-loading');

  const value = boolean(label, defaultValue, groupId);
  if (value) {
    card.setAttribute('full', true);
  } else {
    card.removeAttribute('full');
  }
  return card;
};

card.story = {
  name: 'card',
  parameters: {
    notes: readme,
  },
};
