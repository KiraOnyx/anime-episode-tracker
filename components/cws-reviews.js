(function () {
  const APP_URLS = window.APP_URLS || {};
  const containers = Array.from(document.querySelectorAll('.cws-reviews[data-source]'));
  if (!containers.length) return;

  const state = new WeakMap();

  const t = (key) => {
    try {
      if (window.AET_I18N && typeof window.AET_I18N.t === 'function') {
        return window.AET_I18N.t(key) || '';
      }
    } catch (error) {
      console.warn('[cws-reviews] i18n error', error);
    }
    return '';
  };

  const getLocale = () => {
    const lang = window.AET_I18N?.lang || document.documentElement.lang || 'fr';
    return lang.startsWith('en') ? 'en-US' : 'fr-FR';
  };

  const removeContainer = (container) => {
    if (!container) return;
    const parentSelector = container.getAttribute('data-hide-parent');
    const target = parentSelector ? container.closest(parentSelector) : container;
    if (target) target.remove();
  };

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) return '';
    return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(value);
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const locale = getLocale();
    const options = locale === 'fr-FR'
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  const createStars = (value, allowHalf = false) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cws-reviews__stars';
    wrapper.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= 5; i += 1) {
      const icon = document.createElement('i');
      let className = 'fa-regular fa-star';
      if (value >= i) {
        className = 'fa-solid fa-star';
      } else if (allowHalf && value + 0.5 >= i) {
        className = 'fa-solid fa-star-half-stroke';
      }
      icon.className = className;
      wrapper.appendChild(icon);
    }
    return wrapper;
  };

  const renderMetrics = (container, rating, storeUrl) => {
    if (!rating) return null;
    const { avg, count, users } = rating;
    if (![avg, count, users].every((value) => Number.isFinite(value) && value > 0)) {
      return null;
    }

    const metrics = document.createElement('div');
    metrics.className = 'cws-reviews__metrics';
    metrics.setAttribute('role', 'status');

    const grid = document.createElement('div');
    grid.className = 'cws-reviews__metrics-grid';

    const cards = [
      {
        icon: 'fa-solid fa-star',
        label: t('reviews_metric_rating'),
        value: formatNumber(avg),
        suffix: '/5',
        aria: t('reviews_metric_rating_aria').replace('{{value}}', formatNumber(avg)),
        extra: createStars(avg, true),
      },
      {
        icon: 'fa-solid fa-user-group',
        label: t('reviews_metric_users'),
        value: formatNumber(users),
        aria: t('reviews_metric_users_aria').replace('{{value}}', formatNumber(users)),
      },
      {
        icon: 'fa-solid fa-comments',
        label: t('reviews_metric_reviews'),
        value: formatNumber(count),
        aria: t('reviews_metric_reviews_aria').replace('{{value}}', formatNumber(count)),
      },
    ];

    cards.forEach((card) => {
      const article = document.createElement('article');
      article.className = 'cws-reviews__metric-card';
      if (card.aria) article.setAttribute('aria-label', card.aria);

      const head = document.createElement('div');
      head.className = 'cws-reviews__metric-head';

      const icon = document.createElement('i');
      icon.className = card.icon;
      icon.setAttribute('aria-hidden', 'true');
      head.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'cws-reviews__metric-label';
      label.textContent = card.label;
      head.appendChild(label);

      const value = document.createElement('div');
      value.className = 'cws-reviews__metric-value';

      const number = document.createElement('span');
      number.className = 'cws-reviews__metric-number';
      number.textContent = card.value;
      value.appendChild(number);

      if (card.suffix) {
        const suffix = document.createElement('span');
        suffix.className = 'cws-reviews__metric-suffix';
        suffix.textContent = card.suffix;
        value.appendChild(suffix);
      }

      article.appendChild(head);
      article.appendChild(value);
      if (card.extra) article.appendChild(card.extra);
      grid.appendChild(article);
    });

    metrics.appendChild(grid);

    if (storeUrl) {
      const cta = document.createElement('a');
      cta.className = 'cws-reviews__store btn ghost';
      cta.href = storeUrl;
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
      cta.innerHTML = `<i class="fa-brands fa-chrome" aria-hidden="true"></i> ${t('reviews_store_cta')}`;
      metrics.appendChild(cta);
    }

    return metrics;
  };

  const renderReviews = (container, reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return null;
    }

    const list = document.createElement('div');
    list.className = 'cws-reviews__list';
    list.setAttribute('role', 'list');

    reviews.forEach((review) => {
      if (!review || !review.text || !review.date) return;

      const card = document.createElement('article');
      card.className = 'cws-reviews__card';
      card.setAttribute('role', 'listitem');

      const header = document.createElement('div');
      header.className = 'cws-reviews__card-header';

      const stars = createStars(Number(review.stars) || 0, false);
      header.appendChild(stars);

      const formattedDate = formatDate(review.date);
      const time = document.createElement('time');
      time.className = 'cws-reviews__card-date';
      time.dateTime = review.date;
      time.textContent = formattedDate;
      header.appendChild(time);

      const body = document.createElement('p');
      body.className = 'cws-reviews__card-body';
      body.textContent = review.text.trim();

      card.appendChild(header);
      card.appendChild(body);
      list.appendChild(card);
    });

    if (!list.children.length) return null;
    return list;
  };

  const render = (container, payload) => {
    state.set(container, payload);
    container.innerHTML = '';
    container.setAttribute('aria-busy', 'false');

    const storeUrl = (APP_URLS.webstore || '').trim() || payload.storeUrl || '';

    const titleWrap = document.createElement('header');
    titleWrap.className = 'cws-reviews__header';

    const title = document.createElement('h2');
    title.className = 'cws-reviews__title';
    title.textContent = t('reviews_title');
    titleWrap.appendChild(title);

    const subtitleText = t('reviews_subtitle');
    if (subtitleText) {
      const subtitle = document.createElement('p');
      subtitle.className = 'cws-reviews__subtitle';
      subtitle.textContent = subtitleText;
      titleWrap.appendChild(subtitle);
    }

    container.appendChild(titleWrap);

    const metrics = renderMetrics(container, payload.rating, storeUrl);
    if (metrics) {
      container.appendChild(metrics);
    }

    const reviews = renderReviews(container, payload.reviews);
    if (reviews) {
      container.appendChild(reviews);
    }

    if (!metrics && !reviews) {
      removeContainer(container);
    }
  };

  const validatePayload = (payload) => {
    if (!payload || typeof payload !== 'object') return false;
    const storeUrl = (APP_URLS.webstore || '').trim();
    if (!storeUrl && !payload.storeUrl) return false;
    if (!payload.rating || !payload.reviews) return false;
    if (!Array.isArray(payload.reviews) || payload.reviews.length === 0) return false;
    const { avg, count, users } = payload.rating;
    if (![avg, count, users].every((value) => Number.isFinite(value) && value > 0)) return false;
    return true;
  };

  const fetchReviews = async (endpoint) => {
    const url = endpoint || '/api/reviews.json';
    const response = await fetch(url, { method: 'GET', cache: 'no-cache', credentials: 'omit' });
    if (!response.ok) throw new Error(`http_${response.status}`);
    return response.json();
  };

  const initContainer = async (container) => {
    if (!(APP_URLS.webstore || '').trim()) {
      removeContainer(container);
      return;
    }

    container.setAttribute('aria-busy', 'true');

    try {
      const endpoint = container.getAttribute('data-endpoint');
      const payload = await fetchReviews(endpoint);
      if (!validatePayload(payload)) {
        removeContainer(container);
        return;
      }
      render(container, payload);
    } catch (error) {
      console.warn('[cws-reviews] unable to load reviews', error);
      removeContainer(container);
    }
  };

  const rerender = () => {
    containers.forEach((container) => {
      const payload = state.get(container);
      if (!payload) return;
      render(container, payload);
    });
  };

  containers.forEach((container) => {
    initContainer(container);
  });

  document.addEventListener('lang:changed', rerender);
})();
