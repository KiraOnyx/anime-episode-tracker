(function () {
  const U = window.APP_URLS || {};
  const MEDIA = window.MEDIA_MANIFEST || {};

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
  const previewSelectors = {
    popup: "#shot_popup",
    injection: "#shot_inject",
    settings: "#shot_settings",
    notification: "#shot_notify"
  };
  const previews = MEDIA.previews || {};
  const previewBasePath = "assets/previews/";
  const videoPreviewExt = [".mp4", ".webm", ".mov", ".m4v"];

  const resolvePreviewSrc = (value) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const isAbsolute = /^(?:[a-z]+:)?\/\//.test(trimmed) || trimmed.startsWith("/");
    const hasExplicitPath = trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("assets/");
    if (isAbsolute || hasExplicitPath) return trimmed;
    return `${previewBasePath}${trimmed}`;
  };

  const isVideoPreview = (value) => {
    const lower = value.toLowerCase();
    return videoPreviewExt.some(ext => lower.endsWith(ext));
  };

  Object.entries(previewSelectors).forEach(([key, selector]) => {
    const el = document.querySelector(selector);
    if (!el) return;

    if (!el.dataset.originalLabel) {
      el.dataset.originalLabel = el.textContent.trim();
    }

    const src = resolvePreviewSrc(previews[key]);
    el.style.backgroundImage = "";
    el.classList.remove("is-video-preview");
    const existingVideo = el.querySelector("video");
    if (existingVideo) existingVideo.remove();

    if (!src) {
      el.textContent = el.dataset.originalLabel || "";
      return;
    }

    if (isVideoPreview(src)) {
      el.textContent = "";
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      el.appendChild(video);
      el.classList.add("is-video-preview");
    } else {
      el.textContent = "";
      el.style.backgroundImage = `url('${src}')`;
    }
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
