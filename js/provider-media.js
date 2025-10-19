(function () {
  const containers = document.querySelectorAll("[data-provider-media]");
  if (!containers.length) return;

  const videoExt = [".mp4", ".mov", ".mkv"];
  const imageExt = [".jpg", ".jpeg", ".png"];
  const lightbox = createLightbox();
  const emptyMessages = new Map();
  const kindLabels = new Set();

  function t(key) {
    const api = window.I18N || window.AET_I18N;
    return (api && typeof api.t === "function") ? api.t(key) : "";
  }

  function createLightbox() {
    if (window.MEDIA_LIGHTBOX && typeof window.MEDIA_LIGHTBOX.open === "function") {
      return window.MEDIA_LIGHTBOX;
    }

    const overlay = document.createElement("div");
    overlay.className = "media-lightbox";
    overlay.innerHTML = `
      <div class="media-lightbox__inner" role="dialog" aria-modal="true">
        <button class="media-lightbox__close" type="button" data-close>
          <span class="sr-only"></span>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <div class="media-lightbox__body"></div>
        <div class="media-lightbox__caption"></div>
      </div>
    `;

    const panel = overlay.querySelector(".media-lightbox__inner");
    const body = overlay.querySelector(".media-lightbox__body");
    const caption = overlay.querySelector(".media-lightbox__caption");
    const closeBtn = overlay.querySelector(".media-lightbox__close");
    const srOnly = closeBtn.querySelector(".sr-only");
    let previouslyFocused = null;

    const updateLabel = () => {
      const label = t("media_lightbox_close") || "Close";
      srOnly.textContent = label;
      closeBtn.setAttribute("aria-label", label);
      closeBtn.title = label;
    };

    updateLabel();

    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const close = () => {
      if (!overlay.classList.contains("is-open")) return;
      const activeVideo = body.querySelector("video");
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.currentTime = 0;
      }
      overlay.classList.remove("is-open");
      document.body.classList.remove("has-lightbox");
      body.innerHTML = "";
      caption.textContent = "";
      overlay.removeEventListener("keydown", trapFocus);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus({ preventScroll: true });
      }
      previouslyFocused = null;
    };

    closeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      close();
    });

    panel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    overlay.addEventListener("click", (event) => {
      if (!panel.contains(event.target)) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        event.preventDefault();
        close();
      }
    });

    const i18n = window.I18N || window.AET_I18N;
    if (i18n && typeof i18n.onChange === "function") {
      i18n.onChange(updateLabel);
    } else {
      document.addEventListener("lang:changed", updateLabel);
    }

    document.body.appendChild(overlay);

    const open = ({ type, src, title }) => {
      if (!src) return;
      body.innerHTML = "";
      caption.textContent = title || "";
      previouslyFocused = document.activeElement;

      if (type === "video") {
        const video = document.createElement("video");
        video.src = src;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        body.appendChild(video);
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = title || "";
        body.appendChild(img);
      }

      overlay.classList.add("is-open");
      document.body.classList.add("has-lightbox");
      overlay.addEventListener("keydown", trapFocus);
      updateLabel();
      closeBtn.focus({ preventScroll: true });
    };

    const api = { open, close, updateLabel };
    window.MEDIA_LIGHTBOX = api;
    return api;
  }

  function normaliseName(file) {
    const fileName = file.split("/").pop() || file;
    const withoutOrder = fileName.replace(/^\d+-/, "");
    const withoutExt = withoutOrder.replace(/\.[^.]+$/, "");
    return withoutExt.replace(/[-_]+/g, " ").trim();
  }

  function createMediaCard({ provider, file, type, basePath }) {
    const item = document.createElement("figure");
    item.className = "provider-media-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "provider-media-thumb";

    const src = `${basePath}${file}`;
    const title = normaliseName(file);

    if (type === "video") {
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      button.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      button.appendChild(img);
    }

    button.addEventListener("click", () => {
      lightbox.open({ type, src, title });
    });

    const meta = document.createElement("figcaption");
    meta.className = "provider-media-meta";
    const label = document.createElement("strong");
    label.textContent = title;
    const kind = document.createElement("span");
    kind.dataset.kindType = type;
    kind.textContent = type === "video" ? t("provider_media_video_label") : t("provider_media_image_label");
    kindLabels.add(kind);
    meta.append(label, kind);

    item.append(button, meta);
    return item;
  }

  function renderEmpty(list) {
    list.innerHTML = "";
    const empty = document.createElement("p");
    empty.className = "provider-media-empty";
    empty.textContent = t("provider_media_empty");
    list.appendChild(empty);
    emptyMessages.set(list, empty);
  }

  function updateEmptyMessages() {
    emptyMessages.forEach(el => {
      el.textContent = t("provider_media_empty");
    });
  }

  function updateKindLabels() {
    kindLabels.forEach(el => {
      const type = el.dataset.kindType;
      el.textContent = type === "video" ? t("provider_media_video_label") : t("provider_media_image_label");
    });
  }

  async function loadManifest(provider, container) {
    const basePath = `assets/providers/${provider}/`;
    const manifestUrl = `${basePath}media.json`;
    const fallback = (window.PROVIDER_MEDIA_MANIFESTS && window.PROVIDER_MEDIA_MANIFESTS[provider]) || null;

    const useFallback = () => {
      if (fallback) {
        renderManifest(container, fallback, basePath);
      } else {
        renderManifest(container, { videos: [], images: [] }, basePath);
      }
    };

    if (location.protocol === "file:" && fallback) {
      useFallback();
      return;
    }

    try {
      const response = await fetch(manifestUrl, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const manifest = await response.json();
      renderManifest(container, manifest, basePath);
    } catch (error) {
      console.warn(`[provider-media] Unable to load manifest for ${provider}:`, error);
      useFallback();
    }
  }

  function renderManifest(container, manifest, basePath) {
    const list = container.querySelector("[data-provider-media-list]");
    if (!list) return;
    emptyMessages.delete(list);
    list.innerHTML = "";
    purgeKindLabels();

    const videos = Array.isArray(manifest.videos) ? manifest.videos : [];
    const images = Array.isArray(manifest.images) ? manifest.images : [];

    const items = [];

    videos.filter(file => hasAllowedExtension(file, videoExt)).sort().forEach(file => {
      items.push(createMediaCard({ provider: container.dataset.providerMedia, file, type: "video", basePath }));
    });

    images.filter(file => hasAllowedExtension(file, imageExt)).sort().forEach(file => {
      items.push(createMediaCard({ provider: container.dataset.providerMedia, file, type: "image", basePath }));
    });

    if (!items.length) {
      renderEmpty(list);
      return;
    }

    items.forEach(item => list.appendChild(item));
  }

  function hasAllowedExtension(file, allowed) {
    const lower = file.toLowerCase();
    return allowed.some(ext => lower.endsWith(ext));
  }

  function purgeKindLabels() {
    kindLabels.forEach(el => {
      if (!el.isConnected) kindLabels.delete(el);
    });
  }

  containers.forEach(container => {
    const provider = container.dataset.providerMedia;
    if (!provider) return;
    loadManifest(provider, container);
  });

  document.addEventListener("lang:changed", () => {
    updateEmptyMessages();
    updateKindLabels();
    lightbox.updateLabel();
  });
})();
