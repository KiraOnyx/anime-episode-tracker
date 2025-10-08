(function () {
  const containers = document.querySelectorAll("[data-provider-media]");
  if (!containers.length) return;

  const videoExt = [".mp4", ".mov", ".mkv"];
  const imageExt = [".jpg", ".jpeg", ".png"];
  const lightbox = createLightbox();
  const emptyMessages = new Map();
  const kindLabels = new Set();

  function t(key) {
    return (window.AET_I18N && typeof window.AET_I18N.t === "function") ? window.AET_I18N.t(key) : "";
  }

  function createLightbox() {
    const overlay = document.createElement("div");
    overlay.className = "media-lightbox";
    overlay.innerHTML = `
      <div class="media-lightbox__inner">
        <button class="media-lightbox__close" type="button" aria-label="Close">✕</button>
        <div class="media-lightbox__body"></div>
        <div class="media-lightbox__caption"></div>
      </div>
    `;
    const body = overlay.querySelector(".media-lightbox__body");
    const caption = overlay.querySelector(".media-lightbox__caption");
    const closeBtn = overlay.querySelector(".media-lightbox__close");
    const updateLabel = () => {
      const label = t("media_lightbox_close") || "Close";
      closeBtn.setAttribute("aria-label", label);
      closeBtn.title = label;
    };
    updateLabel();

    const close = () => {
      overlay.classList.remove("is-open");
      document.body.classList.remove("has-lightbox");
      body.innerHTML = "";
      caption.textContent = "";
    };

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) close();
    });

    document.body.appendChild(overlay);

    return {
      open({ type, src, title }) {
        body.innerHTML = "";
        const captionText = title || "";
        if (type === "video") {
          const video = document.createElement("video");
          video.src = src;
          video.controls = true;
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          body.appendChild(video);
        } else {
          const img = document.createElement("img");
          img.src = src;
          img.alt = title || "";
          body.appendChild(img);
        }
        caption.textContent = captionText;
        overlay.classList.add("is-open");
        document.body.classList.add("has-lightbox");
      },
      updateLabel
    };
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
