// Literary Marginalia widget — picks one random quote on every page load.
//
// The corpus used to live in the Cloudflare Worker (/marginalia). It is static
// text, so it has no business being a network round-trip: it now ships as
// assets/marginalia.json and is fetched from Glance's own asset server.
//
// Loaded via document.head; uses a MutationObserver because Glance injects the
// widget HTML after page load.
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function faint(app) {
    app.innerHTML = '<div class="color-paragraph" style="text-align:center; opacity:.5;">—</div>';
  }

  function init() {
    var app = document.getElementById("mg-app");
    if (!app || app.dataset.ready) return;
    app.dataset.ready = "1";

    fetch("/assets/marginalia.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var quotes = Array.isArray(data) ? data : data.quotes;
        if (!quotes || !quotes.length) return faint(app);

        var d = quotes[Math.floor(Math.random() * quotes.length)];
        var work = d.work ? ', <span style="font-style:italic;">' + esc(d.work) + "</span>" : "";
        app.innerHTML =
          '<div style="text-align:center; padding:4px 14px;">' +
          '<div class="size-h4 color-highlight" style="font-style:italic; line-height:1.55;">“' + esc(d.quote) + '”</div>' +
          '<div class="size-h6 color-paragraph" style="margin-top:8px;">— ' + esc(d.author) + work + "</div>" +
          "</div>";
      })
      .catch(function () { faint(app); });
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
