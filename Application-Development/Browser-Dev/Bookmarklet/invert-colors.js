javascript: (function () {
  const css = `html{background:white;filter:
  invert(90%) hue-rotate(180deg) contrast(70%) brightness(70%);}
  html *:not(svg):not(svg *){background:inherit !important;color:inherit
  !important;box-shadow:none !important;text-shadow:none !important;}`;
  const head =
    document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
})();
