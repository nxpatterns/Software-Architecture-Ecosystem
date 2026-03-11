# SVG Animation Examples

## Stroke a line across the path

```html
<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10 L 90 90" stroke="black" stroke-width="2" fill="none">
    <animate attributeName="stroke-dasharray" from="100,150" to="150,200" dur="5s" fill="freeze" />
  </path>
</svg>
  ```
