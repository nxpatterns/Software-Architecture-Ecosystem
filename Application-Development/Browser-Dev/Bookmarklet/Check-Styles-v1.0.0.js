javascript: (function () {
  var newWin = window.open('', '', 'width=600,height=800');
  var doc = newWin.document;
  var body = doc.body;
  var styleEl = doc.createElement('style');
  styleEl.type = 'text/css';
  styleEl.innerHTML =
    'body { font-family: Arial; } .not-ok { background-color: pink; }';
  doc.head.appendChild(styleEl);

  var elements = document.querySelectorAll('*');
  var classesAndIds = [];

  function checkName(name) {
    var regex =
      /^[a-z\d]+(?:-[a-z\d]+)*(?:--[a-z\d]+)*(?:__[a-z\d]+)*$/;
    return regex.test(name);
  }

  elements.forEach(function (element) {
    if (element.id && !checkName(element.id)) {
      classesAndIds.push(element.id);
      element.classList.add('not-ok');
    }
    element.classList.forEach(function (className) {
      if (!checkName(className)) {
        classesAndIds.push(className);
        element.classList.add('not-ok');
      }
    });
  });

  classesAndIds = Array.from(new Set(classesAndIds)).sort();
  var content = classesAndIds.join('<br>');

  body.innerHTML = content;
})();
