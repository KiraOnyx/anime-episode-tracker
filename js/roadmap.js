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

  const t = (key) => {
    if (!key) return "";
    const translator = window.AET_I18N?.t;
    return typeof translator === "function" ? translator(key) : key;
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

  fetch(resolveAssetUrl("assets/roadmap.json"), { cache: "no-cache" })
    .then(response => {
      if (!response.ok) throw new Error("HTTP" + response.status);
      return response.json();
    })
    .then(data => {
      roadmapData = data?.items || [];
      render();
    })
    .catch(() => {
      handleError();
    });

  document.addEventListener("lang:changed", () => {
    render();
  });
})();
