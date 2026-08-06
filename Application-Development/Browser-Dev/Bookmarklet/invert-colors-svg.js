javascript: (function () {
  const css = `html {background: white; filter: invert(100%) hue-rotate(180deg)
  contrast(60%) brightness(60%);}
  body *:not([class*="icon"]):not([class*="mat"]):not(svg):not(svg *),
  body *:not([class*="icon"]):not(svg):not(svg *)::before,
  body *:not([class*="icon"]):not(svg):not(svg *)::after {
    background: inherit !important;
    color: inherit !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }`;
  const head =
    document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
})();
