# PenCard

## Details

The `PenCard` element is an implementation of the card. The card component should not be confused with the [container component](../pen-container), though the two do share some similarities.


## Inherits

`PenCard` inherits from [`PenBase`](../pen-base).

## Attributes

| Name        | Boolean      | Description                                       |
|-------------|--------------|---------------------------------------------------|
| `elevation`     | false        | If present, draw shadow box around the elements.. |


## Usage

```html
<pen-card elevation='1'>
  <span slot="heading">Hello world</span>
  <div slot="body">
    <p>Four score and seven years ago our fathers brought forth on this continent a new nation conceived in liberty and dedicated to the proposition that all men are created equal. <pen-a href="http://xkcd.com" target="_blank">Here's a cool web comic.</pen-a>.</p>
  </div>

  <span slot="footer">
    <span>June 14, 2018</span><span>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;8-min read</span>
  </span>
</pen-card>
```