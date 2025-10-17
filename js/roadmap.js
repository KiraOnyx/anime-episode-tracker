(function () {
  const grid = document.querySelector("[data-roadmap-grid]");
  if (!grid) return;

  const emptyState = document.querySelector("[data-roadmap-empty]");
  const statusLabelByKey = {
    now: "roadmap_now_label",
    next: "roadmap_next_label",
    later: "roadmap_later_label"
  };

  let roadmapData = null;
  const storageKey = "aet_roadmap_items_v1";

  const fallbackItems = (() => {
    const globalFallback = window.AET_ROADMAP_FALLBACK;
    if (Array.isArray(globalFallback)) return globalFallback;
    return [
      {
        id: "now_speed",
        status: "now",
        emoji: "⚡",
        titleKey: "roadmap_now_speed_title",
        descriptionKey: "roadmap_now_speed_desc",
        points: [
          { icon: "fa-solid fa-rotate", textKey: "roadmap_now_speed_point1" },
          { icon: "fa-solid fa-hourglass-half", textKey: "roadmap_now_speed_point2" },
          { icon: "fa-solid fa-eye", textKey: "roadmap_now_speed_point3" }
        ],
        progress: { value: 68, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "now_import",
        status: "now",
        emoji: "🧰",
        titleKey: "roadmap_now_import_title",
        descriptionKey: "roadmap_now_import_desc",
        points: [
          { icon: "fa-solid fa-file-arrow-up", textKey: "roadmap_now_import_point1" },
          { icon: "fa-solid fa-layer-group", textKey: "roadmap_now_import_point2" },
          { icon: "fa-solid fa-circle-check", textKey: "roadmap_now_import_point3" }
        ],
        progress: { value: 42, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "now_badge",
        status: "now",
        emoji: "🎯",
        titleKey: "roadmap_now_badge_title",
        descriptionKey: "roadmap_now_badge_desc",
        points: [
          { icon: "fa-solid fa-sparkles", textKey: "roadmap_now_badge_point1" },
          { icon: "fa-solid fa-toggle-on", textKey: "roadmap_now_badge_point2" }
        ],
        progress: { value: 75, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "next_animesama",
        status: "next",
        emoji: "🌐",
        titleKey: "roadmap_next_animesama_title",
        descriptionKey: "roadmap_next_animesama_desc",
        points: [
          { icon: "fa-solid fa-layer-group", textKey: "roadmap_next_animesama_point1" },
          { icon: "fa-solid fa-bell", textKey: "roadmap_next_animesama_point2" },
          { icon: "fa-solid fa-link", textKey: "roadmap_next_animesama_point3" }
        ],
        progress: { value: 10, labelKey: "roadmap_progress_start" }
      },
      {
        id: "next_languages",
        status: "next",
        emoji: "🌍",
        titleKey: "roadmap_next_languages_title",
        descriptionKey: "roadmap_next_languages_desc",
        points: [
          { icon: "fa-solid fa-a", textKey: "roadmap_next_languages_point1" },
          { icon: "fa-regular fa-clock", textKey: "roadmap_next_languages_point2" }
        ],
        progress: { value: 20, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "next_micro",
        status: "next",
        emoji: "🪄",
        titleKey: "roadmap_next_micro_title",
        descriptionKey: "roadmap_next_micro_desc",
        points: [
          { icon: "fa-regular fa-hand-pointer", textKey: "roadmap_next_micro_point1" },
          { icon: "fa-regular fa-face-smile", textKey: "roadmap_next_micro_point2" }
        ],
        progress: { value: 15, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "later_notes",
        status: "later",
        emoji: "📒",
        titleKey: "roadmap_later_notes_title",
        descriptionKey: "roadmap_later_notes_desc",
        points: [
          { icon: "fa-regular fa-star", textKey: "roadmap_later_notes_point1" },
          { icon: "fa-regular fa-note-sticky", textKey: "roadmap_later_notes_point2" }
        ],
        progress: { value: 5, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "later_reminders",
        status: "later",
        emoji: "🔔",
        titleKey: "roadmap_later_reminders_title",
        descriptionKey: "roadmap_later_reminders_desc",
        points: [
          { icon: "fa-regular fa-bell", textKey: "roadmap_later_reminders_point1" }
        ],
        progress: { value: 0, labelKey: "roadmap_progress_estimate" }
      },
      {
        id: "later_home",
        status: "later",
        emoji: "🧭",
        titleKey: "roadmap_later_home_title",
        descriptionKey: "roadmap_later_home_desc",
        points: [
          { icon: "fa-solid fa-compass", textKey: "roadmap_later_home_point1" }
        ],
        progress: { value: 0, labelKey: "roadmap_progress_estimate" }
      }
    ];
  })();

  const t = (key) => {
    if (!key) return "";
    const translator = window.AET_I18N?.t;
    return typeof translator === "function" ? translator(key) : key;
  };

  const readStoredItems = () => {
    try {
      const raw = window.localStorage?.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.warn("[roadmap] Unable to read cached roadmap:", error);
      return null;
    }
  };

  const writeStoredItems = (items) => {
    if (!Array.isArray(items)) return;
    try {
      window.localStorage?.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.warn("[roadmap] Unable to cache roadmap:", error);
    }
  };

  const createPoint = (point) => {
    const wrapper = document.createElement("div");
    wrapper.className = "road-point";

    const icon = document.createElement("i");
    icon.className = point.icon || "";
    wrapper.appendChild(icon);

    const span = document.createElement("span");
    span.innerHTML = t(point.textKey);
    wrapper.appendChild(span);

    return wrapper;
  };

  const createCard = (item) => {
    const article = document.createElement("article");
    article.className = "road-card";
    article.dataset.roadStatus = item.status;

    const head = document.createElement("div");
    head.className = "road-head";

    const title = document.createElement("div");
    title.className = "road-title";

    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = item.emoji || "";
    title.appendChild(emoji);

    const titleText = document.createElement("span");
    titleText.innerHTML = t(item.titleKey);
    title.appendChild(titleText);

    head.appendChild(title);

    const pill = document.createElement("span");
    pill.className = `pill ${item.status}`;
    pill.innerHTML = t(statusLabelByKey[item.status] || "");
    head.appendChild(pill);

    article.appendChild(head);

    const description = document.createElement("p");
    description.className = "road-desc";
    description.innerHTML = t(item.descriptionKey);
    article.appendChild(description);

    if (Array.isArray(item.points) && item.points.length) {
      const list = document.createElement("div");
      list.className = "road-points";
      item.points.forEach(point => {
        list.appendChild(createPoint(point));
      });
      article.appendChild(list);
    }

    if (item.progress) {
      const progressWrapper = document.createElement("div");
      progressWrapper.className = "progress";
      progressWrapper.setAttribute("title", t(item.progress.labelKey));
      progressWrapper.setAttribute("data-i18n", item.progress.labelKey || "");
      progressWrapper.setAttribute("data-i18n-attr", "title");

      const progressInner = document.createElement("span");
      progressInner.style.setProperty("--p", `${item.progress.value ?? 0}%`);
      progressWrapper.appendChild(progressInner);
      article.appendChild(progressWrapper);
    }

    return article;
  };

  const render = () => {
    if (!Array.isArray(roadmapData)) return;
    grid.innerHTML = "";
    roadmapData.forEach(item => {
      grid.appendChild(createCard(item));
    });
    grid.hidden = false;
    if (emptyState) emptyState.hidden = true;
    document.dispatchEvent(new CustomEvent("roadmap:updated"));
  };

  const applyItems = (items, options = {}) => {
    if (!Array.isArray(items)) return false;
    roadmapData = items;
    render();
    if (!options.skipStore) {
      writeStoredItems(items);
    }
    return true;
  };

  const handleError = () => {
    grid.innerHTML = "";
    grid.hidden = true;
    if (emptyState) emptyState.hidden = false;
  };

  const resolveAssetUrl = (path) => {
    try {
      if (typeof window.chrome?.runtime?.getURL === "function") {
        return window.chrome.runtime.getURL(path);
      }
    } catch (err) {
      // ignore and fall back to the relative URL below
    }
    return path;
  };

  if (!applyItems(readStoredItems(), { skipStore: true }) && fallbackItems.length) {
    applyItems(fallbackItems, { skipStore: true });
  }

  const loadRoadmap = async () => {
    const url = resolveAssetUrl("assets/roadmap.json");

    try {
      const response = await fetch(url, { cache: "no-store" });

      if (response.status === 304) {
        if (Array.isArray(roadmapData)) {
          return;
        }
        if (applyItems(readStoredItems(), { skipStore: true })) {
          return;
        }
        if (applyItems(fallbackItems, { skipStore: true })) {
          return;
        }
        throw new Error("HTTP304");
      }

      if (!response.ok) {
        throw new Error(`HTTP${response.status}`);
      }

      const data = await response.json();
      if (!applyItems(data?.items || [])) {
        throw new Error("Empty roadmap payload");
      }
    } catch (error) {
      console.warn("[roadmap] Unable to load roadmap.json:", error);
      if (!Array.isArray(roadmapData)
        && !applyItems(readStoredItems(), { skipStore: true })
        && !applyItems(fallbackItems, { skipStore: true })) {
        handleError();
      }
    }
  };

  loadRoadmap();

  document.addEventListener("lang:changed", () => {
    render();
  });
})();
