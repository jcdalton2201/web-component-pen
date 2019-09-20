import { document } from 'global';
import '../../dist/pen-ssn/pen-ssn.js';
import readme from './readme.md';
import { withKnobs, boolean, text } from '@storybook/addon-knobs';
export default {
  title: 'SSN',
  decorators: [withKnobs],
};
const groupId = 'GROUP-ID1';
export const ssn = () => {
  const isRequired = boolean('required', false, groupId);
  const isDisabled = boolean('disabled', false, groupId);
  const isReadonly = boolean('read-only', false, groupId);
  const ssn = document.createElement('pen-ssn');
  ssn.value = text('value', '', groupId);
  ssn.innerText = 'SSN ';
  if (isRequired) {
    ssn.required = true;
  } else {
    ssn.required = false;
  }
  if (isDisabled) {
    ssn.disabled = true;
  } else {
    ssn.disabled = false;
  }
  if (isReadonly) {
    ssn.readonly = true;
  } else {
    ssn.readonly = false;
  }
  return ssn;
};

ssn.story = {
  name: 'ssn',
  parameters: {
    notes: readme,
  },
};
