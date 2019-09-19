# PenButton

## Details

`PenButton` is a web component implementation of the  Ultimately the component renders a button and sets styles relative to what the system defines.

There are several variants of the button, called types. Each has it's own specific meaning and use cases; more detail can be found at the pen above. Here's what the system says about the button component.

>Buttons communicate the action that will take place when triggered. They’re hierarchically more important than lpen text or another pattern that points to supplementary content.

## Inherits

`PenButton` inherits from [`PenBase`](../pen-base).

## Attributes

| Name        | Boolean      | Description                                       |
|-------------|--------------|---------------------------------------------------|
| `type`      | false        | Analagous to the `HTMLButtonElement`'s type attribute. Reflected as a property. |
| `loading`   | true         | The loading attribute will toggle the element's loading state. This is reflected as a property. |
| `disabled`  | true         | Sets the internal button's disabled state. Is reflected by the `disabled` property. |
| `size`      | false        | Changes the button's size. Valid values are `'normal'` and `'small'`. |

## Public API

| Name               | Type         | Description                                       |
|--------------------|--------------|---------------------------------------------------|
| `submitForm`       | Method       | If a form is attached to the button (via the `PenButton.prototype.form` property), sumbit it. |

## Usage

```html
<pen-button variant="action">Normal action button</pen-button>
<pen-button variant="progressive" size="small">Small progressive button</pen-button>
<pen-button variant="destructive" disabled>Disabled destructive button</pen-button>
```
