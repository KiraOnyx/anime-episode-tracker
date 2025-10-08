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

  // Roadmap filters
  const roadFilters = document.querySelector("[data-road-filters]");
  if (roadFilters) {
    const cards = Array.from(document.querySelectorAll(".road-card"));
    const buttons = Array.from(roadFilters.querySelectorAll("[data-road-filter]"));

    const applyFilter = (value) => {
      buttons.forEach(btn => {
        const isActive = btn.dataset.roadFilter === value;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });
      cards.forEach(card => {
        const status = card.dataset.roadStatus;
        const show = value === "all" || status === value;
        card.style.display = show ? "" : "none";
      });
    };

    roadFilters.addEventListener("click", (event) => {
      const target = event.target.closest("[data-road-filter]");
      if (!target) return;
      event.preventDefault();
      applyFilter(target.dataset.roadFilter || "all");
    });

    applyFilter("all");
  }

  const voirAnimeCard = document.querySelector("[data-provider-card='VoirAnime']");
  const voirAnimePanel = document.getElementById("provider-media-VoirAnime");
  if (voirAnimeCard && voirAnimePanel) {
    let panelOpen = !voirAnimePanel.hidden;

    const setPanelState = (open) => {
      panelOpen = open;
      voirAnimePanel.hidden = !open;
      voirAnimeCard.setAttribute("aria-expanded", open ? "true" : "false");
      voirAnimeCard.classList.toggle("is-active", open);
      if (open) {
        voirAnimePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const togglePanel = () => {
      setPanelState(!panelOpen);
      if (!panelOpen) {
        voirAnimeCard.focus();
      }
    };

    voirAnimeCard.addEventListener("click", () => {
      togglePanel();
    });

    voirAnimeCard.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      togglePanel();
    });
  }
})();
