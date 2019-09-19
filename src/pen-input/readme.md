# PenInput

## Details

The `PenInput` element is an implementation of HTML input with a label.

## Inherits

 `PenInput` inherits from ['PenInputBase`](../pen-input-base).

## Attributes

|Attribute	|Description|
|-----------|-----------|
|maxlength	|The maximum number of characters the input should accept
|minlength	|The minimum number of characters long the input can be and still be considered valid
|pattern	|A regular expression the input's contents must match in order to be valid
|placeholder	|An exemplar value to display in the input field whenever it is empty
|readonly	|A Boolean attribute indicating whether or not the contents of the input should be read-only
|size	|A number indicating how many characters wide the input field should be|

## Usage

```html
<pen-input id='name' name='name'>Some Label<pen-input>
```