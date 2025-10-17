(function () {
  const grid = document.querySelector("[data-roadmap-grid]");
  if (!grid) return;

  const emptyState = document.querySelector("[data-roadmap-empty]");
  const statusLabelByKey = {
    now: "roadmap_now_label",
    next: "roadmap_next_label",
    later: "roadmap_later_label"
  };

  const statusAlias = {
    current: "now",
    doing: "now",
    inprogress: "now",
    upcoming: "next",
    planned: "next",
    soon: "next",
    backlog: "later",
    future: "later"
  };

  const storageKey = "aet_roadmap_items_v1";
  let roadmapData = [];

  const globalFallback = window.AET_ROADMAP_FALLBACK;
  const fallbackItems = Array.isArray(globalFallback) ? globalFallback : [];

  const isPlainObject = (value) => Object.prototype.toString.call(value) === "[object Object]";

  const normalizeStatus = (value) => {
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (statusLabelByKey[normalized]) return normalized;
    if (normalized && statusAlias[normalized]) return statusAlias[normalized];
    return normalized || "later";
  };

  const toIntlMap = (value) => {
    if (!isPlainObject(value)) return null;
    const entries = Object.entries(value).reduce((acc, [lang, text]) => {
      if (typeof text !== "string") return acc;
      const trimmed = text.trim();
      if (!trimmed) return acc;
      acc[lang.toLowerCase()] = trimmed;
      return acc;
    }, {});
    return Object.keys(entries).length ? entries : null;
  };

  const emptyTextSource = () => ({ text: "", key: "", intl: null, fallback: "" });

  const extractTextSource = (obj, baseKey) => {
    const source = emptyTextSource();
    if (!isPlainObject(obj)) return source;

    const raw = obj[baseKey];
    if (isPlainObject(raw) && ("text" in raw || "key" in raw || "intl" in raw || "fallback" in raw)) {
      if (typeof raw.text === "string") source.text = raw.text.trim();
      if (typeof raw.key === "string") source.key = raw.key.trim();
      if (typeof raw.fallback === "string") source.fallback = raw.fallback.trim();
      source.intl = toIntlMap(raw.intl) || null;
    } else {
      if (typeof raw === "string") {
        source.text = raw.trim();
      } else {
        source.intl = toIntlMap(raw) || null;
      }

      const keyValue = obj[`${baseKey}Key`];
      if (typeof keyValue === "string") source.key = keyValue.trim();

      const fallbackValue = obj[`${baseKey}Fallback`];
      if (typeof fallbackValue === "string") source.fallback = fallbackValue.trim();

      const intlValue = obj[`${baseKey}Intl`];
      const intlMap = toIntlMap(intlValue);
      if (intlMap) source.intl = intlMap;

      const textValue = obj[`${baseKey}Text`];
      if (!source.text && typeof textValue === "string") source.text = textValue.trim();
    }

    return source;
  };

  const normalizePoint = (point) => {
    if (!isPlainObject(point)) return null;
    const icon = typeof point.icon === "string" ? point.icon.trim() : "";
    const text = extractTextSource(point, "text");
    if (!icon && !text.key && !text.text && !text.intl && !text.fallback) return null;
    return { icon, text };
  };

  const clampProgress = (value) => {
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value)));
  };

  const toNumericValue = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "");
      const normalized = cleaned.replace(/,/g, ".");
      const parsed = Number(normalized);
      return parsed;
    }
    return Number.NaN;
  };

  const normalizeProgress = (progress) => {
    if (progress == null) return null;
    if (typeof progress === "number") {
      return { value: clampProgress(progress), label: null };
    }
    if (typeof progress === "string" && progress.trim()) {
      const parsed = toNumericValue(progress);
      if (Number.isFinite(parsed)) {
        return { value: clampProgress(parsed), label: null };
      }
    }
    if (!isPlainObject(progress)) return null;
    const value = toNumericValue(progress.value);
    const label = extractTextSource(progress, "label");
    return {
      value: clampProgress(Number.isFinite(value) ? value : 0),
      label
    };
  };

  const normalizeItem = (item, index) => {
    if (!isPlainObject(item)) return null;
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `roadmap_item_${index}`;
    const status = normalizeStatus(item.status || item.stage || item.column || item.state);
    const emoji = typeof item.emoji === "string" ? item.emoji.trim() : "";
    const title = extractTextSource(item, "title");
    const description = extractTextSource(item, "description");
    const points = Array.isArray(item.points) ? item.points.map(normalizePoint).filter(Boolean) : [];
    const progress = normalizeProgress(item.progress);
    return { id, status, emoji, title, description, points, progress };
  };

  const collectItems = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!isPlainObject(payload)) return null;
    if (Array.isArray(payload.items)) return payload.items;

    const collected = [];
    ["now", "next", "later"].forEach((key) => {
      if (!Array.isArray(payload[key])) return;
      payload[key].forEach((entry) => {
        if (isPlainObject(entry)) {
          collected.push({ ...entry, status: entry.status ?? key });
        }
      });
    });

    if (Array.isArray(payload.sections)) {
      payload.sections.forEach((section) => {
        if (!isPlainObject(section) || !Array.isArray(section.items)) return;
        const sectionStatus = section.status || section.key || section.id;
        section.items.forEach((entry) => {
          collected.push({ ...entry, status: entry.status ?? sectionStatus });
        });
      });
    }

    return collected.length ? collected : null;
  };

  const normalizeItems = (input) => {
    const rawItems = collectItems(input);
    if (!rawItems) return null;
    const normalized = rawItems
      .map((item, index) => normalizeItem(item, index))
      .filter(Boolean);
    return normalized;
  };

  const translate = (key) => {
    if (!key) return "";
    try {
      const translator = window.AET_I18N?.t;
      if (typeof translator === "function") {
        const value = translator(key);
        if (typeof value === "string" && value.trim()) {
          return value;
        }
      }
    } catch (error) {
      console.warn("[roadmap] Translation error:", error);
    }
    return key;
  };

  const currentLang = () => (window.AET_I18N?.lang || document.documentElement.lang || "fr").toLowerCase();

  const resolveFromIntl = (intl) => {
    if (!intl) return "";
    const lang = currentLang();
    if (intl[lang]) return intl[lang];
    const docLang = (document.documentElement.lang || "").toLowerCase();
    if (docLang && intl[docLang]) return intl[docLang];
    if (intl.fr) return intl.fr;
    if (intl.en) return intl.en;
    return Object.values(intl).find((value) => typeof value === "string" && value.trim()) || "";
  };

  const resolveText = (source) => {
    if (!source) return "";
    const intl = resolveFromIntl(source.intl);
    if (intl) return intl;
    if (source.key) {
      const translated = translate(source.key);
      if (translated) return translated;
    }
    if (source.text) return source.text;
    if (source.fallback) return source.fallback;
    return "";
  };

  const readStoredItems = () => {
    try {
      const raw = window.localStorage?.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
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

    if (point.icon) {
      const icon = document.createElement("i");
      icon.className = point.icon;
      wrapper.appendChild(icon);
    }

    const span = document.createElement("span");
    span.innerHTML = resolveText(point.text);
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
    titleText.innerHTML = resolveText(item.title);
    title.appendChild(titleText);

    head.appendChild(title);

    const pill = document.createElement("span");
    pill.className = `pill ${item.status}`;
    const statusKey = statusLabelByKey[item.status];
    const statusLabel = statusKey ? translate(statusKey) : (item.status || "");
    pill.textContent = statusLabel;
    if (statusKey) {
      pill.dataset.i18n = statusKey;
      pill.dataset.i18nAttr = "text";
    }
    head.appendChild(pill);

    article.appendChild(head);

    const description = document.createElement("p");
    description.className = "road-desc";
    description.innerHTML = resolveText(item.description);
    article.appendChild(description);

    if (Array.isArray(item.points) && item.points.length) {
      const list = document.createElement("div");
      list.className = "road-points";
      item.points.forEach((point) => {
        list.appendChild(createPoint(point));
      });
      article.appendChild(list);
    }

    if (item.progress) {
      const progressWrapper = document.createElement("div");
      progressWrapper.className = "progress";

      const label = item.progress.label ? resolveText(item.progress.label) : "";
      progressWrapper.setAttribute("title", label);
      if (item.progress.label?.key) {
        progressWrapper.dataset.i18n = item.progress.label.key;
        progressWrapper.dataset.i18nAttr = "title";
      } else {
        progressWrapper.removeAttribute("data-i18n");
        progressWrapper.removeAttribute("data-i18n-attr");
      }

      const progressInner = document.createElement("span");
      progressInner.style.setProperty("--p", `${item.progress.value ?? 0}%`);
      progressWrapper.appendChild(progressInner);
      article.appendChild(progressWrapper);
    }

    return article;
  };

  const render = () => {
    if (!Array.isArray(roadmapData)) return;
    const fragment = document.createDocumentFragment();
    roadmapData.forEach((item) => {
      fragment.appendChild(createCard(item));
    });
    grid.innerHTML = "";
    grid.appendChild(fragment);
    grid.hidden = false;
    if (emptyState) emptyState.hidden = true;
    document.dispatchEvent(new CustomEvent("roadmap:updated"));
  };

  const applyItems = (items, options = {}) => {
    const normalized = normalizeItems(items);
    if (normalized === null) return false;
    roadmapData = normalized;
    render();
    if (!options.skipStore) {
      writeStoredItems(normalized);
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
    } catch (error) {
      // Ignore and fall back to the relative URL below
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
        if (Array.isArray(roadmapData) && roadmapData.length) {
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

      const payload = await response.json();
      if (!applyItems(payload)) {
        throw new Error("Invalid roadmap payload");
      }
    } catch (error) {
      console.warn("[roadmap] Unable to load roadmap.json:", error);
      if (!Array.isArray(roadmapData) || !roadmapData.length) {
        if (applyItems(readStoredItems(), { skipStore: true })) return;
        if (applyItems(fallbackItems, { skipStore: true })) return;
        handleError();
      }
    }
  };

  loadRoadmap();

  document.addEventListener("lang:changed", () => {
    render();
  });
})();
