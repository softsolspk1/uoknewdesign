// Safety net: jquery.counterup's scroll-triggered count animation can get
// interrupted or run erratically slow (fast/programmatic scroll, timing
// races) and never settle on the real number. Snapshot each counter's
// authored text up front, then repeatedly re-assert it for a window long
// enough to outlast any legitimate animation, so the final visible value
// is always correct no matter what the animation does in between.
document.addEventListener('DOMContentLoaded', function () {
  var counters = document.querySelectorAll('.counter-number');
  var originals = [];
  counters.forEach(function (el) { originals.push(el.textContent); });

  var elapsed = 0;
  var step = 400;
  var timer = setInterval(function () {
    elapsed += step;
    counters.forEach(function (el, i) {
      if (el.textContent !== originals[i]) {
        el.textContent = originals[i];
      }
    });
    if (elapsed >= 12000) clearInterval(timer);
  }, step);
});
