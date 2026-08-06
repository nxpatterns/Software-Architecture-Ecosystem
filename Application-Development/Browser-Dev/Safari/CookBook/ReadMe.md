# Safari Cookbook

## Detect Safari via CSS

 ```css
@media not all and (min-resolution:.001dpcm) {
  @supports (-webkit-appearance:none) {
    .e-g-main {
      overflow: auto;
      -webkit-overflow-scrolling: auto;
    }
  }
}
 ```

## Detect Safari via JavaScript

Not reliable in some edge cases, but it works in most cases.

```javascript
function isSafari() {
  const userAgent = window.navigator.userAgent;
  const safari = userAgent.includes('Safari');
  const chrome = userAgent.includes('Chrome');

  /**
   * Safari's userAgent string includes 'Safari' and not 'Chrome',
   * while Chrome's userAgent string includes both 'Chrome' and 'Safari'.
   * Notice "&&" !!
   */

  return safari && !chrome;
}

if (isSafari()) {
  console.log('This is Safari');
}
```
