const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <section class="cws-reviews" aria-live="polite">
    <div class="cws-reviews__metrics" role="status"></div>
    <div class="cws-reviews__intro">
      <h2>Ce que disent nos utilisateurs</h2>
      <p>Les derniers avis du Chrome Web Store, mis à jour chaque lundi à 00h00.</p>
    </div>
    <div class="cws-reviews__content"></div>
  </section>
`;

const MOCK_PAYLOAD = Object.freeze({
  extensionId: 'mock-extension-id',
  storeUrl: 'https://chromewebstore.google.com/',
  fetchedAt: '2024-03-25T00:00:00.000Z',
  rating: {
    avg: 4.8,
    count: 128,
    users: 3620,
  },
  reviews: [
    {
      stars: 5,
      date: '2024-03-18',
      text: "Extension super pratique : je vois en un clin d'oeil les épisodes manquants, et les alertes VF arrivent très vite.",
      source: 'mock',
    },
    {
      stars: 4,
      date: '2024-03-11',
      text: "Interface propre et facile à comprendre. J'aimerais juste pouvoir filtrer par langue, sinon rien à redire.",
      source: 'mock',
    },
    {
      stars: 5,
      date: '2024-03-05',
      text: "Depuis que je l'utilise, je ne rate plus les sorties VoirAnime. Le badge +N est devenu indispensable.",
      source: 'mock',
    },
  ],
});

class CwsReviews extends HTMLElement {
  constructor() {
    super();
    this._endpoint = this.getAttribute('endpoint') || '/api/reviews.json';
    this._storeUrl = this.getAttribute('store-url') || '';
    this._root = null;
    this._content = null;
    this._metrics = null;
    this._abortController = null;
  }

  connectedCallback() {
    if (!this._root) {
      this._renderShell();
      this._load();
    }
  }

  disconnectedCallback() {
    if (this._abortController) {
      this._abortController.abort();
    }
  }

  _renderShell() {
    const node = TEMPLATE.content.cloneNode(true);
    this.innerHTML = '';
    this.appendChild(node);
    this._root = this.querySelector('.cws-reviews');
    this._content = this.querySelector('.cws-reviews__content');
    this._metrics = this.querySelector('.cws-reviews__metrics');
    if (this._root) {
      this._root.setAttribute('aria-busy', 'true');
    }
    this._renderSkeleton();
  }

  async _load() {
    if (this._shouldUseMock()) {
      this._applyPayload(MOCK_PAYLOAD, true);
      return;
    }

    this._abortController = new AbortController();
    try {
      const response = await fetch(this._endpoint, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        signal: this._abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`http_${response.status}`);
      }

      const payload = await response.json();
      if (!payload || !payload.rating) {
        throw new Error('invalid_payload');
      }

      this._applyPayload(payload);
    } catch (error) {
      console.warn('cws-reviews-load-error', error);
      this._applyPayload(MOCK_PAYLOAD, true);
    } finally {
      if (this._abortController) {
        this._abortController = null;
      }
      if (this._root) {
        this._root.setAttribute('aria-busy', 'false');
      }
    }
  }

  _renderSkeleton() {
    if (this._metrics) {
      const metricsSkeleton = document.createElement('div');
      metricsSkeleton.className = 'cws-reviews__metrics-grid';
      for (let i = 0; i < 3; i += 1) {
        const card = document.createElement('div');
        card.className = 'cws-reviews__metric-card cws-reviews__metric-card--skeleton';
        const bar = document.createElement('div');
        bar.className = 'cws-reviews__skeleton-bar cws-reviews__skeleton-bar--medium';
        const bar2 = document.createElement('div');
        bar2.className = 'cws-reviews__skeleton-bar cws-reviews__skeleton-bar--short';
        card.appendChild(bar);
        card.appendChild(bar2);
        metricsSkeleton.appendChild(card);
      }
      this._metrics.innerHTML = '';
      this._metrics.appendChild(metricsSkeleton);
    }

    if (!this._content) return;
    const skeleton = document.createElement('div');
    skeleton.className = 'cws-reviews__skeleton';
    skeleton.setAttribute('aria-hidden', 'true');

    const bar = document.createElement('div');
    bar.className = 'cws-reviews__skeleton-bar cws-reviews__skeleton-bar--short';
    skeleton.appendChild(bar);

    const bar2 = document.createElement('div');
    bar2.className = 'cws-reviews__skeleton-bar cws-reviews__skeleton-bar--medium';
    skeleton.appendChild(bar2);

    const grid = document.createElement('div');
    grid.className = 'cws-reviews__skeleton-grid';
    for (let i = 0; i < 3; i += 1) {
      const card = document.createElement('div');
      card.className = 'cws-reviews__skeleton-bar cws-reviews__skeleton-card';
      grid.appendChild(card);
    }
    skeleton.appendChild(grid);

    this._content.innerHTML = '';
    this._content.appendChild(skeleton);
  }

  _applyPayload(payload, isMock = false) {
    if (!payload || !payload.rating) {
      this._renderError();
      return;
    }
    this._renderMetrics(payload, isMock);
    this._renderReviews(payload, isMock);
    if (this._root) {
      this._root.setAttribute('aria-busy', 'false');
      if (isMock) {
        this._root.dataset.source = 'mock';
      } else {
        delete this._root.dataset.source;
      }
    }
  }

  _shouldUseMock() {
    if (this.hasAttribute('use-mock')) return true;
    const endpoint = (this._endpoint || '').trim().toLowerCase();
    return endpoint === 'mock';
  }

  _renderMetrics(payload, isMock = false) {
    if (!this._metrics) return;
    const { rating, extensionId, storeUrl } = payload;
    if (storeUrl) {
      this._storeUrl = storeUrl;
    } else if (extensionId) {
      this._storeUrl = `https://chromewebstore.google.com/detail/${extensionId}`;
    }
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'cws-reviews__metrics-grid';

    const ratingCard = this._createMetricCard({
      icon: 'fa-solid fa-star',
      label: 'Note moyenne',
      value: rating.avg.toFixed(1),
      suffix: '/5',
      ariaLabel: `Note moyenne ${rating.avg.toFixed(1)} sur 5`,
      extra: this._createStars(rating.avg)
    });

    const usersCard = this._createMetricCard({
      icon: 'fa-solid fa-user-group',
      label: 'Utilisateurs',
      value: this._formatNumber(rating.users),
      ariaLabel: `${this._formatNumber(rating.users)} utilisateurs`
    });

    const reviewsCard = this._createMetricCard({
      icon: 'fa-solid fa-comments',
      label: 'Avis',
      value: this._formatNumber(rating.count),
      ariaLabel: `${this._formatNumber(rating.count)} avis`
    });

    metricsGrid.appendChild(ratingCard);
    metricsGrid.appendChild(usersCard);
    metricsGrid.appendChild(reviewsCard);

    this._metrics.innerHTML = '';
    this._metrics.appendChild(metricsGrid);

    if (isMock) {
      const mockNotice = document.createElement('p');
      mockNotice.className = 'cws-reviews__mock-notice';
      mockNotice.textContent = 'Données de démonstration affichées en attendant la publication sur le Chrome Web Store.';
      this._metrics.appendChild(mockNotice);
    }
  }

  _createMetricCard({ icon, label, value, suffix = '', extra = null, ariaLabel = '' }) {
    const card = document.createElement('article');
    card.className = 'cws-reviews__metric-card';
    if (ariaLabel) {
      card.setAttribute('aria-label', ariaLabel);
    }

    const head = document.createElement('div');
    head.className = 'cws-reviews__metric-head';

    const iconEl = document.createElement('i');
    iconEl.className = `cws-reviews__metric-icon ${icon}`;
    iconEl.setAttribute('aria-hidden', 'true');
    head.appendChild(iconEl);

    const labelEl = document.createElement('span');
    labelEl.className = 'cws-reviews__metric-label';
    labelEl.textContent = label;
    head.appendChild(labelEl);

    card.appendChild(head);

    const valueWrap = document.createElement('div');
    valueWrap.className = 'cws-reviews__metric-value';

    const valueEl = document.createElement('span');
    valueEl.className = 'cws-reviews__metric-number';
    valueEl.textContent = value;
    valueWrap.appendChild(valueEl);

    if (suffix) {
      const suffixEl = document.createElement('span');
      suffixEl.className = 'cws-reviews__metric-suffix';
      suffixEl.textContent = suffix;
      valueWrap.appendChild(suffixEl);
    }

    card.appendChild(valueWrap);

    if (extra) {
      card.appendChild(extra);
    }

    return card;
  }

  _createStars(avg) {
    const stars = document.createElement('div');
    stars.className = 'cws-reviews__metric-stars';
    stars.setAttribute('aria-hidden', 'true');

    const fullStars = Math.floor(avg);
    const remainder = avg - fullStars;

    for (let i = 1; i <= 5; i += 1) {
      const star = document.createElement('i');
      if (i <= fullStars) {
        star.className = 'fa-solid fa-star';
      } else if (i === fullStars + 1 && remainder >= 0.25 && remainder < 0.75) {
        star.className = 'fa-solid fa-star-half-stroke';
      } else if (i === fullStars + 1 && remainder >= 0.75) {
        star.className = 'fa-solid fa-star';
      } else {
        star.className = 'fa-regular fa-star';
      }
      stars.appendChild(star);
    }

    return stars;
  }

  _renderReviews(payload) {
    if (!this._content) return;
    const { reviews = [], extensionId, storeUrl } = payload;
    if (storeUrl) {
      this._storeUrl = storeUrl;
    }

    if (!reviews.length) {
      this._renderEmpty(extensionId);
      return;
    }

    const list = document.createElement('div');
    list.className = 'cws-reviews__list';
    list.setAttribute('role', 'list');

    for (const review of reviews) {
      list.appendChild(this._createReviewCard(review));
    }

    this._content.innerHTML = '';
    this._content.appendChild(list);
  }

  _createReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'cws-reviews__card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Avis ${review.stars} étoiles du ${this._formatDate(review.date)}`);

    const header = document.createElement('div');
    header.className = 'cws-reviews__card-header';

    const stars = document.createElement('div');
    stars.className = 'cws-reviews__card-stars';
    stars.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= 5; i += 1) {
      const star = document.createElement('i');
      star.className = `fa-${i <= review.stars ? 'solid' : 'regular'} fa-star`;
      stars.appendChild(star);
    }

    const date = document.createElement('time');
    date.className = 'cws-reviews__card-date';
    date.dateTime = review.date;
    date.textContent = this._formatDate(review.date);

    header.appendChild(stars);
    header.appendChild(date);

    const body = document.createElement('p');
    body.className = 'cws-reviews__card-body';
    body.textContent = review.text;

    const author = document.createElement('p');
    author.className = 'cws-reviews__card-author';
    const shield = document.createElement('i');
    shield.className = 'fa-solid fa-shield-check';
    shield.setAttribute('aria-hidden', 'true');
    author.appendChild(shield);
    author.appendChild(document.createTextNode(' Utilisateur vérifié'));

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(author);

    return card;
  }

  _renderEmpty(extensionId) {
    if (!this._content) return;
    const empty = document.createElement('div');
    empty.className = 'cws-reviews__empty';
    empty.setAttribute('role', 'status');
    const url = this._storeUrl || (extensionId ? `https://chromewebstore.google.com/detail/${extensionId}` : 'https://chromewebstore.google.com');

    const title = document.createElement('strong');
    title.textContent = 'Aucun avis récent pour le moment.';

    const copy = document.createElement('span');
    copy.textContent = 'Revenez bientôt pour découvrir les derniers retours.';

    const link = document.createElement('a');
    link.className = 'btn';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Voir sur le Chrome Web Store';

    empty.appendChild(title);
    empty.appendChild(copy);
    empty.appendChild(link);
    this._content.innerHTML = '';
    this._content.appendChild(empty);
  }

  _renderError() {
    if (!this._content) return;
    if (this._metrics) {
      this._metrics.innerHTML = '';
      const message = document.createElement('span');
      message.textContent = 'Avis indisponibles actuellement.';
      this._metrics.appendChild(message);
    }
    const error = document.createElement('div');
    error.className = 'cws-reviews__empty';
    error.setAttribute('role', 'status');
    const url = this._storeUrl || 'https://chromewebstore.google.com';

    const title = document.createElement('strong');
    title.textContent = 'Impossible de charger les avis.';

    const copy = document.createElement('span');
    copy.textContent = 'Veuillez réessayer plus tard ou consulter la fiche sur le Chrome Web Store.';

    const link = document.createElement('a');
    link.className = 'btn';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Chrome Web Store';

    error.appendChild(title);
    error.appendChild(copy);
    error.appendChild(link);
    this._content.innerHTML = '';
    this._content.appendChild(error);
  }

  _formatNumber(value) {
    if (!Number.isFinite(value)) return '0';
    return new Intl.NumberFormat(navigator.language || 'fr-FR').format(value);
  }

  _formatDate(date) {
    try {
      const lang = navigator.language || 'fr-FR';
      const locale = lang.startsWith('fr') ? 'fr-FR' : 'en-US';
      const options = locale === 'fr-FR'
        ? { day: '2-digit', month: '2-digit', year: '2-digit' }
        : { day: 'numeric', month: 'numeric', year: '2-digit' };
      const formatter = new Intl.DateTimeFormat(locale, options);
      return formatter.format(new Date(date));
    } catch {
      return date;
    }
  }
}

if (!customElements.get('cws-reviews')) {
  customElements.define('cws-reviews', CwsReviews);
}
