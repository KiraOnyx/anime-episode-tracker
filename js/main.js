(function () {
  const doc = document;
  const APP_URLS = window.APP_URLS || {};

  const getActiveLang = () => {
    const i18n = window.AET_I18N;
    if (i18n) {
      if (typeof i18n.lang === "string") return i18n.lang;
      if (typeof i18n.getLang === "function") {
        try {
          const value = i18n.getLang();
          if (value) return value;
        } catch (error) {
          console.warn("[i18n] failed to read lang", error);
        }
      }
    }
    return doc.documentElement.getAttribute("lang") || "fr";
  };

  const updateLangIndicator = () => {
    const span = doc.getElementById("lang-code");
    if (!span) return;
    const code = (getActiveLang() || "fr").slice(0, 2).toUpperCase();
    span.textContent = code;
  };

  document.addEventListener("click", (event) => {
    const item = event.target.closest(".lang-item");
    if (!item) return;
    const lang = item.getAttribute("data-lang");
    if (!lang) return;
    const api = window.AET_I18N || window.I18N;
    if (api && typeof api.setLang === "function") {
      api.setLang(lang);
      updateLangIndicator();
    }
  });

  const translate = (key) => {
    try {
      if (window.AET_I18N && typeof window.AET_I18N.t === "function") {
        return window.AET_I18N.t(key) || "";
      }
    } catch (error) {
      console.warn("[i18n] translation error", error);
    }
    return "";
  };

  const normaliseUrl = (value) => (typeof value === "string" ? value.trim() : "");

  const isHttpUrl = (value) => /^https?:/i.test(value);

  const hydrateLinks = () => {
    doc.querySelectorAll("[data-href]").forEach((el) => {
      const key = el.getAttribute("data-href");
      if (!key) return;
      const parentSection = el.closest("section[data-hide-when-empty]");
      if (parentSection) {
        parentSection.dataset.hasDynamicChildren = "true";
      }
      const url = normaliseUrl(APP_URLS[key]);
      if (!url) {
        if (el.hasAttribute("data-hide-when-empty")) {
          const parentSelector = el.getAttribute("data-hide-parent");
          const target = parentSelector ? el.closest(parentSelector) : el;
          if (target) target.remove();
        } else {
          el.removeAttribute("href");
        }
        return;
      }

      el.setAttribute("href", url);
      if (isHttpUrl(url)) {
        const rel = new Set((el.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
        rel.add("noopener");
        rel.add("noreferrer");
        el.setAttribute("rel", Array.from(rel).join(" "));
        if (!el.hasAttribute("target")) {
          el.setAttribute("target", "_blank");
        }
      }
    });

    doc
      .querySelectorAll("section[data-hide-when-empty][data-has-dynamic-children='true']")
      .forEach((section) => {
        if (!section.isConnected) return;
        const interactive = section.querySelector(
          ".btn[href], a[href], button, [role='button'], .btn[role], [tabindex]:not([tabindex='-1'])"
        );
        if (!interactive) {
          section.remove();
        }
      });

    const supportSection = doc.querySelector(".support-feedback[data-hide-when-empty]");
    if (supportSection) {
      const hasAction = supportSection.querySelector(".actions > *");
      if (!hasAction) {
        supportSection.remove();
      }
    }
  };

  const ensureMeta = (property, value) => {
    if (!value) return;
    let meta = doc.querySelector(`meta[property='${property}']`);
    if (!meta) {
      meta = doc.createElement("meta");
      meta.setAttribute("property", property);
      doc.head.appendChild(meta);
    }
    meta.setAttribute("content", value);
  };

  const initProviderPanel = () => {
    const card = doc.querySelector("[data-provider-card='VoirAnime']");
    const panel = doc.getElementById("provider-media-VoirAnime");
    if (!card || !panel) return;

    let open = !panel.hidden;
    const setState = (state) => {
      open = state;
      panel.hidden = !state;
      card.setAttribute("aria-expanded", state ? "true" : "false");
      card.classList.toggle("is-active", state);
      if (state) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const toggle = () => {
      setState(!open);
      if (!open) {
        card.focus();
      }
    };

    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle();
    });
  };

  const updateFooterYear = () => {
    const y = doc.getElementById("copyright-year");
    if (y) y.textContent = String(new Date().getFullYear());
  };

  const initLanguageDropdown = () => {
    const dropdown = doc.querySelector(".nav-lang.dropdown");
    if (!dropdown) return;

    const toggle = dropdown.querySelector("#lang-toggle");
    const menu = dropdown.querySelector(".menu");
    if (!toggle || !menu) return;

    const getItems = () => Array.from(dropdown.querySelectorAll(".lang-item[data-lang]"));

    const setOpen = (state) => {
      dropdown.classList.toggle("is-open", state);
      if (state) {
        menu.removeAttribute("hidden");
      } else {
        menu.setAttribute("hidden", "");
      }
      toggle.setAttribute("aria-expanded", state ? "true" : "false");
    };

    const close = () => setOpen(false);
    const open = () => setOpen(true);

    const handleDocumentClick = (event) => {
      if (!dropdown.contains(event.target)) {
        close();
      }
    };

    const handleDocumentKeydown = (event) => {
      if (event.key === "Escape" && dropdown.classList.contains("is-open")) {
        close();
        toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = dropdown.classList.contains("is-open");
      setOpen(!isOpen);
      if (!isOpen) {
        const first = getItems()[0];
        if (first) {
          first.focus();
        }
      }
    });

    toggle.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!dropdown.classList.contains("is-open")) {
          open();
        }
        const first = getItems()[0];
        if (first) {
          first.focus();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        toggle.focus({ preventScroll: true });
      }
    });

    menu.addEventListener("click", (event) => {
      const button = event.target.closest(".lang-item[data-lang]");
      if (!button) return;
      event.preventDefault();
      const value = button.dataset.lang;
      if (value && window.AET_I18N && typeof window.AET_I18N.setLang === "function") {
        window.AET_I18N.setLang(value);
        updateLangIndicator();
      }
      close();
      toggle.focus({ preventScroll: true });
    });

    doc.addEventListener("click", handleDocumentClick);
    doc.addEventListener("keydown", handleDocumentKeydown);
    doc.addEventListener("lang:changed", () => {
      close();
    });

    setOpen(false);
    updateLangIndicator();
  };

  const init = () => {
    hydrateLinks();
    ensureMeta("og:url", normaliseUrl(APP_URLS.site_url));
    ensureMeta("og:image", normaliseUrl(APP_URLS.og_image));
    initProviderPanel();
    updateFooterYear();
    initLanguageDropdown();
    updateLangIndicator();
    doc.addEventListener("lang:changed", updateLangIndicator);
  };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();

document.addEventListener("DOMContentLoaded", () => {
  const manifest = window.MEDIA_MANIFEST?.previews || [];
  if (!manifest.length) return;

  const imgGroup = document.querySelector("#media-images .media-grid");
  const vidGroup = document.querySelector("#media-videos .media-grid");

  manifest.forEach(item => {
    const ext = item.src.split(".").pop().toLowerCase();
    const isVideo = item.type === "video" || /(mp4|mkv|webm)$/.test(ext);
    const group = isVideo ? vidGroup : imgGroup;
    if (!group) return;

    const el = document.createElement(isVideo ? "video" : "img");
    el.src = item.src;
    el.alt = item.alt || "";
    el.setAttribute("aria-label", item.alt || item.src);
    el.className = "media-item";
    el.loading = "lazy";

    if (isVideo) {
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.preload = "metadata";
      el.tabIndex = 0;
      const stopVideo = () => { el.pause(); el.currentTime = 0; };
      el.addEventListener("mouseenter", () => el.play());
      el.addEventListener("focus", () => el.play());
      el.addEventListener("mouseleave", stopVideo);
      el.addEventListener("blur", stopVideo);
      el.addEventListener("click", () => {
        stopVideo();
        window.MEDIA_LIGHTBOX?.open?.({ type: "video", src: item.src, title: item.alt });
      });
      el.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        stopVideo();
        window.MEDIA_LIGHTBOX?.open?.({ type: "video", src: item.src, title: item.alt });
      });
    } else {
      el.addEventListener("click", () => window.MEDIA_LIGHTBOX?.open?.({ type: "image", src: item.src, title: item.alt }));
    }

    const wrapper = document.createElement("div");
    wrapper.className = "shot";
    wrapper.setAttribute("role", "listitem");
    wrapper.appendChild(el);
    group.appendChild(wrapper);
  });

  document.querySelectorAll(".media-group").forEach(g => {
    if (!g.querySelector(".shot")) g.remove();
  });
});

(function setActiveNav(){
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const map = { "index.html": "nav-home", "privacy.html": "nav-privacy" };
  const id = map[path];
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("is-active");
  }
})();
