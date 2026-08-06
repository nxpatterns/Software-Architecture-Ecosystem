# Browser Console

## Change Site's default font & bg-color via DevTools

```js
// an arbitrary example
let addStyle = document.createElement('style');
addStyle.innerHTML = `
  body, aside.blurb { font-family: "Georgia"; background-color: #6767676e}
  div#top-bar { display:none}
  `;
document.head.appendChild(addStyle);
```

## Console (Log...)

```bash
assert
clear
context
count
countReset
debug
dir
dirxml
error
group
groupCollapsed
groupEnd
info
log

memory: MemoryInfo
    jsHeapSizeLimit:
    totalJSHeapSize:
    usedJSHeapSize:

profile
profileEnd
table
time
timeEnd
timeLog
timeStamp
trace
warn
```
