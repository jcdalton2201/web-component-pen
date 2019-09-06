/**
 * Transforms kebob case strings to camel case strings
 * @example
 * // returns 'myKebobCase'
 * kebobToCamelCase('my-kebob-case');
 * @param {string} _string - the kebob-case string to transform to camelCase
 * @returns {string}
 */
const kebobToCamelCase = _string => {
  // eslint-disable-next-line no-useless-escape
  return _string.replace(/(\-\w)/g, word => word[1].toUpperCase());
};

/** Characters that must be escaped in a string */
const escapeCharacters = '\\^$*+?.()|{}[]'.split('');

/**
 * Splice characters into a base string and return the result
 * @param {string} string - The base string
 * @param {number} index - The index at which to splice
 * @param {string} chars - The characters to splice into the base string
 * @return { string } - A newly-spliced string
 * @todo Move to string utils file
 */
const splice = (string, index, chars) =>
  string.slice(0, index) + chars + string.slice(index + 1);

export { escapeCharacters, kebobToCamelCase, splice };
