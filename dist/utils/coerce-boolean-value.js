/**
 * Converts string boolean values to true booleans.
 * @param {string} value - the value to check its truthy
 * @param {string} attributeName - (optional) the elements attribute name to be compared with value
 * @return void
 */
const coerceBooleanValue = (value, attributeName) => {
  return (
    String(value) === 'true' || String(value) === '' || value === attributeName
  );
};

export { coerceBooleanValue };
