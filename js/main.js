(function () {
  const U = window.APP_URLS || {};

  // Propager les href depuis data-href
  document.querySelectorAll("[data-href]").forEach(a => {
    const key = a.getAttribute("data-href");
    const val = U[key];
    if (val) a.setAttribute("href", val);
    if (!val && a.hasAttribute("data-hide-when-empty")) {
      a.closest(a.getAttribute("data-hide-when-empty") || "a")?.remove();
    }
  });

  // Captures (si fournies)
  const shots = {
    shot_popup: "#shot_popup",
    shot_inject: "#shot_inject",
    shot_settings: "#shot_settings",
    shot_notify: "#shot_notify"
  };
  Object.entries(shots).forEach(([k, sel]) => {
    const el = document.querySelector(sel);
    if (el && U[k]) el.style.backgroundImage = `url('${U[k]}')`;
  });

  // Open Graph dynamic fallback (facultatif)
  const setMeta = (name, content) => {
    if (!content) return;
    let m = document.querySelector(`meta[property='${name}']`);
    if (!m) { m = document.createElement("meta"); m.setAttribute("property", name); document.head.appendChild(m); }
    m.setAttribute("content", content);
  };
  setMeta("og:url", U.site_url);
  setMeta("og:image", U.og_image);

  // Année footer
  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();
})();