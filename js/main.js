(function () {
  const doc = document;
  const APP_URLS = window.APP_URLS || {};
  const MEDIA = window.MEDIA_MANIFEST || {};

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

  const resolvePreviewSrc = (value) => {
    const raw = normaliseUrl(value);
    if (!raw) return "";
    const isAbsolute = /^(?:[a-z]+:)?\/\//i.test(raw) || raw.startsWith("/");
    const hasPath = raw.startsWith("./") || raw.startsWith("../") || raw.startsWith("assets/");
    return isAbsolute || hasPath ? raw : `assets/previews/${raw}`;
  };

  const isVideo = (value) => /\.(mp4|webm|mov|m4v)$/i.test(value || "");

  const lightboxFocusState = { previouslyFocused: null };

  const createMediaLightbox = () => {
    if (window.MEDIA_LIGHTBOX && typeof window.MEDIA_LIGHTBOX.open === "function") {
      return window.MEDIA_LIGHTBOX;
    }

    const overlay = doc.createElement("div");
    overlay.className = "media-lightbox";
    overlay.innerHTML = `
      <div class="media-lightbox__inner" role="dialog" aria-modal="true">
        <button class="media-lightbox__close" type="button">
          <span class="sr-only"></span>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <div class="media-lightbox__body"></div>
        <div class="media-lightbox__caption" data-media-caption></div>
      </div>
    `;

    const body = overlay.querySelector(".media-lightbox__body");
    const caption = overlay.querySelector("[data-media-caption]");
    const closeBtn = overlay.querySelector(".media-lightbox__close");
    const srSpan = closeBtn.querySelector(".sr-only");

    const updateCloseLabel = () => {
      const closeText = translate("media_lightbox_close") || "Close";
      srSpan.textContent = closeText;
      closeBtn.setAttribute("aria-label", closeText);
      closeBtn.title = closeText;
    };

    updateCloseLabel();

    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const close = () => {
      overlay.classList.remove("is-open");
      doc.body.classList.remove("has-lightbox");
      body.innerHTML = "";
      caption.textContent = "";
      overlay.removeEventListener("keydown", trapFocus);
      if (lightboxFocusState.previouslyFocused && lightboxFocusState.previouslyFocused.focus) {
        lightboxFocusState.previouslyFocused.focus({ preventScroll: true });
      }
      lightboxFocusState.previouslyFocused = null;
    };

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        event.preventDefault();
        close();
      }
    });

    doc.addEventListener("lang:changed", updateCloseLabel);

    const open = ({ type, src, title }) => {
      if (!src) return;
      body.innerHTML = "";
      caption.textContent = title || "";
      let node;
      if (type === "video") {
        node = doc.createElement("video");
        node.src = src;
        node.controls = true;
        node.playsInline = true;
        node.preload = "metadata";
        if (title) node.setAttribute("aria-label", title);
      } else {
        node = doc.createElement("img");
        node.src = src;
        node.alt = title || "";
      }
      body.appendChild(node);
      lightboxFocusState.previouslyFocused = doc.activeElement;
      overlay.classList.add("is-open");
      doc.body.classList.add("has-lightbox");
      overlay.addEventListener("keydown", trapFocus);
      updateCloseLabel();
      closeBtn.focus({ preventScroll: true });
    };

    doc.body.appendChild(overlay);

    const api = { open, updateLabel: updateCloseLabel };

    window.MEDIA_LIGHTBOX = api;
    return api;
  };

  const previewLabels = new Map();

  const updatePreviewLabels = () => {
    previewLabels.forEach((config, el) => {
      if (!el.isConnected) {
        previewLabels.delete(el);
        return;
      }
      const { labelKey } = config;
      const label = labelKey ? translate(labelKey) : "";
      if (label) {
        el.setAttribute("aria-label", label);
      }
    });
  };

  const getPreviewTitle = (labelKey) => {
    if (!labelKey) return "";
    return translate(labelKey) || "";
  };

  const setupPreview = (config) => {
    const { key, selector, labelKey } = config;
    const container = doc.querySelector(selector);
    if (!container) return;

    const src = resolvePreviewSrc((MEDIA.previews || {})[key]);
    container.innerHTML = "";
    container.classList.remove("is-video-preview");
    container.removeAttribute("role");
    container.removeAttribute("tabindex");
    container.removeAttribute("aria-label");

    if (!src) {
      previewLabels.delete(container);
      return;
    }

    const title = getPreviewTitle(labelKey);
    container.setAttribute("role", "button");
    container.setAttribute("tabindex", "0");
    container.dataset.previewType = isVideo(src) ? "video" : "image";
    container.dataset.previewSrc = src;
    container.dataset.previewLabelKey = labelKey || "";
    if (title) container.setAttribute("aria-label", title);
    previewLabels.set(container, { labelKey });

    const mediaLightbox = createMediaLightbox();

    const renderImage = () => {
      const img = doc.createElement("img");
      img.src = src;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.loading = "lazy";
      container.appendChild(img);
    };

    const renderVideo = () => {
      const video = doc.createElement("video");
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-hidden", "true");
      video.tabIndex = -1;
      container.appendChild(video);
      container.classList.add("is-video-preview");

      const stopVideo = () => {
        video.pause();
        video.currentTime = 0;
      };

      container.addEventListener("mouseenter", () => {
        if (container.matches(":hover")) {
          video.play().catch(() => {});
        }
      });
      container.addEventListener("mouseleave", stopVideo);
      container.addEventListener("focusout", (event) => {
        if (!container.contains(event.relatedTarget)) {
          stopVideo();
        }
      });
      container.addEventListener("blur", (event) => {
        if (event.relatedTarget !== container) {
          stopVideo();
        }
      });
    };

    if (isVideo(src)) {
      renderVideo();
    } else {
      renderImage();
    }

    const openPreview = () => {
      const type = container.dataset.previewType;
      const source = container.dataset.previewSrc;
      if (!type || !source) return;
      if (type === "video") {
        const video = container.querySelector("video");
        if (video) {
          video.pause();
        }
      }
      const labelKey = container.dataset.previewLabelKey;
      const title = getPreviewTitle(labelKey);
      mediaLightbox.open({ type, src: source, title });
    };

    container.addEventListener("click", (event) => {
      event.preventDefault();
      openPreview();
    });

    container.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openPreview();
    });
  };

  const initPreviews = () => {
    const configs = [
      { key: "popup", selector: "#shot_popup", labelKey: "preview_label_popup" },
      { key: "injection", selector: "#shot_inject", labelKey: "preview_label_injection" },
      { key: "settings", selector: "#shot_settings", labelKey: "preview_label_settings" },
      { key: "notification", selector: "#shot_notify", labelKey: "preview_label_notification" }
    ];
    configs.forEach(setupPreview);
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
    initPreviews();
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

  doc.addEventListener("lang:changed", updatePreviewLabels);
})();

(function setActiveNav(){
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const map = { "index.html": "nav-home", "privacy.html": "nav-privacy" };
  const id = map[path];
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("is-active");
  }
})();
