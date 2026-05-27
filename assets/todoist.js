// Interactive Todoist widget for the SASSAFRAS dashboard.
// Talks to the Cloudflare Worker (which holds the Todoist token); the browser
// only carries the dashboard key. Loaded via <script src> from glance.yml's document.head.
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function init() {
    var app = document.getElementById("td-app");
    if (!app || app.dataset.ready) return; // run once
    app.dataset.ready = "1";

    var worker = (app.dataset.worker || "").replace(/\/$/, "");
    var key = app.dataset.key || "";
    var list = document.getElementById("td-list");
    var form = document.getElementById("td-add");
    var input = document.getElementById("td-input");
    var headers = { "X-Dashboard-Key": key, "Content-Type": "application/json" };

    function api(path, opts) {
      return fetch(worker + path, Object.assign({ headers: headers }, opts || {}));
    }

    function render(tasks) {
      list.innerHTML = "";
      if (!tasks || !tasks.length) {
        list.innerHTML = '<li class="color-paragraph" style="opacity:.6">Nothing to do 🎉</li>';
        return;
      }
      tasks.forEach(function (t) {
        var li = document.createElement("li");
        li.className = "td-item flex items-center gap-10";
        li.innerHTML =
          '<button class="td-check" title="Complete" aria-label="Complete task"></button>' +
          '<div class="flex-grow min-w-0">' +
          '<div class="td-content size-h5 color-highlight">' + escapeHtml(t.content) + "</div>" +
          (t.dueString ? '<div class="size-h6 color-paragraph">' + escapeHtml(t.dueString) + "</div>" : "") +
          "</div>";
        li.querySelector(".td-check").addEventListener("click", function () {
          li.classList.add("td-done");
          api("/todoist/close", { method: "POST", body: JSON.stringify({ id: t.id }) })
            .then(function (r) {
              if (!r.ok) throw new Error("close failed");
              setTimeout(function () { li.remove(); }, 250);
            })
            .catch(function () { li.classList.remove("td-done"); });
        });
        list.appendChild(li);
      });
    }

    function load() {
      api("/todoist")
        .then(function (r) { return r.json(); })
        .then(function (d) { render(d.tasks || []); })
        .catch(function () {
          list.innerHTML = '<li class="color-negative">Couldn\'t reach tasks.</li>';
        });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var content = input.value.trim();
        if (!content) return;
        input.value = "";
        api("/todoist/add", { method: "POST", body: JSON.stringify({ content: content }) })
          .then(function (r) { if (!r.ok) throw new Error("add failed"); load(); })
          .catch(function () { input.value = content; });
      });
    }

    load();
  }

  // Glance injects widget HTML asynchronously after page load, so #td-app may not
  // exist when this script first runs. Watch the DOM and init once it appears.
  function boot() {
    init();
    var existing = document.getElementById("td-app");
    if (existing && existing.dataset.ready) return;
    var obs = new MutationObserver(function () {
      var app = document.getElementById("td-app");
      if (app && !app.dataset.ready) init();
      if (app && app.dataset.ready) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 30000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
