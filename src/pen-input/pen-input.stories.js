import { document } from 'global';
import '../../dist/pen-input/pen-input.js';
import readme from './readme.md';
import { withKnobs, boolean, text } from '@storybook/addon-knobs';
export default {
  title: 'Input',
  decorators: [withKnobs],
};
const groupId = 'GROUP-ID1';
export const input = () => {
  const isRequired = boolean('required', false, groupId);
  const isDisabled = boolean('disabled', false, groupId);
  const isReadonly = boolean('read-only', false, groupId);
  const input = document.createElement('pen-input');
  const maxLength = text('max-length', null, groupId);
  const minLength = text('min-length', null, groupId);
  const placeholder = text('placeholder', null, groupId);
  const pattern = text('pattern', null, groupId);
  input.value = text('value', '', groupId);
  input.innerText = 'First ';
  if (isRequired) {
    input.required = true;
  } else {
    input.required = false;
  }
  if (isDisabled) {
    input.disabled = true;
  } else {
    input.disabled = false;
  }
  if (isReadonly) {
    input.readonly = true;
  } else {
    input.readonly = false;
  }
  input.maxlength = maxLength;
  input.minlength = minLength;
  input.placeholder = placeholder;
  input.pattern = pattern;
  return input;
};

input.story = {
  name: 'input',
  parameters: {
    notes: readme,
  },
};
