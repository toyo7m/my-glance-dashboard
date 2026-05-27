// Literary Marginalia widget — fetches one random quote from the Worker on every
// page load (so it changes on refresh). Loaded via document.head; uses a
// MutationObserver because Glance injects the widget HTML after page load.
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function init() {
    var app = document.getElementById("mg-app");
    if (!app || app.dataset.ready) return;
    app.dataset.ready = "1";
    var worker = (app.dataset.worker || "").replace(/\/$/, "");
    var key = app.dataset.key || "";

    fetch(worker + "/marginalia", { headers: { "X-Dashboard-Key": key }, cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var work = d.work ? ', <span style="font-style:italic;">' + esc(d.work) + "</span>" : "";
        app.innerHTML =
          '<div style="text-align:center; padding:4px 14px;">' +
          '<div class="size-h4 color-highlight" style="font-style:italic; line-height:1.55;">“' + esc(d.quote) + '”</div>' +
          '<div class="size-h6 color-paragraph" style="margin-top:8px;">— ' + esc(d.author) + work + "</div>" +
          "</div>";
      })
      .catch(function () {
        app.innerHTML = '<div class="color-paragraph" style="text-align:center; opacity:.5;">—</div>';
      });
  }

  function boot() {
    init();
    var a = document.getElementById("mg-app");
    if (a && a.dataset.ready) return;
    var obs = new MutationObserver(function () {
      var x = document.getElementById("mg-app");
      if (x && !x.dataset.ready) init();
      if (x && x.dataset.ready) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 30000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
