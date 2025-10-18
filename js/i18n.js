(function () {
  const storageKey = "aet_lang";
  const fallbackLang = "fr";
  const dynamicValues = {
    year: new Date().getFullYear().toString()
  };

  const translations = {
    fr: {
      brand_title: "Anime Episode Tracker",
      nav_primary: "Navigation principale",
      nav_home: "Accueil",
      nav_roadmap: "Roadmap",
      nav_privacy: "Confidentialité des données",
      nav_install: "Installer",
      skip_to_content: "Passer au contenu",
      lang_switch_label: "Changer de langue",
      lang_option_fr: "Français",
      lang_option_en: "Anglais",
      hero_title: "Ne ratez plus aucun épisode.",
      index_meta_title: "Anime Episode Tracker",
      index_meta_description: "Ne ratez plus aucun épisode. Alertes VF/VOSTFR. Simples. Précises. Élégantes.",
      hero_sub: "L’extension repère les nouveaux épisodes en VF et VOSTFR et vous prévient en quelques secondes. Pas de réglages compliqués : ouvrez vos sites habituels et suivez votre liste.",
      hero_cta_install: "Installer sur Chrome",
      hero_cta_feedback: "Signaler un bug",
      hero_note: "Zéro tracking • Données en local",
      providers_title: "Sites pris en charge",
      providers_sub: "Nous surveillons vos plateformes d’anime pour vous signaler les nouveautés. Voici ce qui est déjà prêt et ce qui arrive bientôt.",
      provider_voiranime_title: "VoirAnime",
      provider_status_live: "Disponible",
      provider_voiranime_desc: "Une fois sur la page d’un épisode, un bouton “Suivre” vous permet de l’ajouter directement dans l’extension.",
      provider_voiranime_hint: "Cliquez pour afficher un aperçu VoirAnime.",
      provider_animesama_title: "AnimeSama",
      provider_status_soon: "En préparation",
      provider_animesama_desc: "L’intégration AnimeSama arrive : notifications VF/VOSTFR/VA, sauvegarde de votre progression et suivi des scans de mangas sont en cours de finalisation.",
      provider_media_title: "Aperçu de l’intégration VoirAnime",
      provider_media_empty: "Ajoutez vos captures pour les voir ici.",
      provider_media_video_label: "Vidéo",
      provider_media_image_label: "Image",
      media_lightbox_close: "Fermer",
      features_title: "Fonctionnalités",
      feature_alerts_title: "Alertes instantanées",
      feature_alerts_desc: "Notification dès qu’un nouvel épisode sort en VF ou en VOSTFR. Vous savez tout de suite quoi regarder.",
      feature_seasons_title: "Toutes vos saisons",
      feature_seasons_desc: "L’extension garde la trace de chaque saison automatiquement : aucun tableau à maintenir, juste vos séries à jour.",
      feature_badge_title: "Badges <span class=\"badgeN\">+N</span>",
      feature_badge_desc: "Le badge <span class=\"badgeN\">+N</span> montre le nombre d’épisodes en retard. Vous pouvez le masquer quand vous êtes à jour.",
      feature_refresh_title: "Rafraîchissement simple",
      feature_refresh_desc: "Un clic met toutes les fiches à jour. Le bouton se grise le temps du scan pour vous montrer qu’il travaille.",
      feature_language_title: "Langues et dates claires",
      feature_language_desc: "Les textes s’adaptent en français ou en anglais et les dates sont affichées au bon format automatiquement.",
      feature_integration_title: "Intégration VoirAnime",
      feature_integration_desc: "Un bouton “Ajouter” apparaît sur les fiches VoirAnime pour suivre un anime sans quitter la page.",
      media_title: "Aperçus de l’extension",
      media_images: "Captures d’écran",
      media_videos: "Vidéos de démonstration",
      footer_install: "Installer",
      footer_feedback: "Signaler un bug",
      footer_note: "Anime Episode Tracker — Non affilié à VoirAnime/MAL",
      footer_disclaimer: "Non affilié à VoirAnime/MyAnimeList",
      support_title: "Besoin d’un coup de main ?",
      support_intro: "Vous avez repéré un comportement suspect ou souhaitez un audit plus détaillé ? Dites-le nous en quelques clics.",
      support_intro_simple:
        "Vous avez repéré un comportement suspect ou que tu as des idées d’amélioration ? Dites-le nous en quelques minutes en remplissant le formulaire adéquat.",
      support_cta_bug: "Signaler un bug",
      support_cta_ideas: "Suggestions & améliorations",
      support_cta_bug_label: "Ouvrir le formulaire de signalement de bug",
      support_cta_ideas_label: "Ouvrir le formulaire de suggestions et améliorations",
      reviews_title: "Avis Chrome Web Store",
      reviews_subtitle: "Derniers retours vérifiés, mis à jour automatiquement.",
      reviews_metric_rating: "Note moyenne",
      reviews_metric_rating_aria: "Note moyenne {{value}} sur 5",
      reviews_metric_users: "Utilisateurs",
      reviews_metric_users_aria: "{{value}} utilisateurs",
      reviews_metric_reviews: "Avis",
      reviews_metric_reviews_aria: "{{value}} avis",
      reviews_store_cta: "Voir sur le Chrome Web Store",
      privacy_meta_title: "Confidentialité des données — Anime Episode Tracker",
      privacy_meta_description: "Aucune télémétrie. Données en local. Permissions minimales.",
      privacy_title: "Confidentialité <strong>des données</strong>",
      privacy_intro: "Nous ne collectons rien, vos données restent chez vous et vous gardez la main en permanence.",
      privacy_card_local_title: "Aucune télémétrie",
      privacy_card_local_desc: "Aucun tracking, aucune analytics. L’extension fonctionne sans envoyer de données personnelles ni de statistiques d’usage vers un serveur tiers.",
      privacy_card_local_point1: "Les séries suivies, vos épisodes vus et vos réglages restent dans <code>chrome.storage.local</code>.",
      privacy_card_local_point2: "Aucune synchronisation cachée : pas de profilage ni de publicité.",
      privacy_card_permissions_title: "Permissions minimales",
      privacy_card_permissions_desc: "Chaque permission est expliquée avant installation et ne sert qu’à suivre les épisodes en temps réel.",
      privacy_perm_storage_name: "Stockage",
      privacy_perm_storage_desc: "Sauvegarde vos données dans le navigateur.",
      privacy_perm_alarms_name: "Alarmes",
      privacy_perm_alarms_desc: "Planifie les vérifications d’épisodes.",
      privacy_perm_notifications_name: "Notifications",
      privacy_perm_notifications_desc: "Affiche les alertes système lorsque de nouveaux épisodes sortent.",
      privacy_perm_sites_name: "Accès VoirAnime",
      privacy_perm_sites_desc: "Lecture seule du site pour repérer vos séries suivies.",
      privacy_card_control_title: "Contrôle total",
      privacy_card_control_desc: "Exportez, sauvegardez ou supprimez vos données en un clic depuis l’interface.",
      privacy_card_control_point1: "Export JSON pour récupérer vos séries à tout moment.",
      privacy_card_control_point2: "Import sécurisé : fusionne les données existantes sans doublon.",
      privacy_card_control_point3: "Réinitialisation complète disponible depuis les paramètres.",
      privacy_card_media_title: "Images et visuels",
      privacy_card_media_desc: "Les posters d’anime sont chargés en blob pour éviter le hotlink et respecter la bande passante des sites sources.",
      privacy_card_media_point1: "Les visuels sont mis en cache localement.",
      privacy_card_media_point2: "Les images sont supprimées automatiquement lors de la réinitialisation.",
      privacy_toc_nav: "Sommaire",
      privacy_toc_local: "Données locales",
      privacy_toc_permissions: "Permissions",
      privacy_toc_control: "Contrôle & suppression",
      privacy_toc_media: "Médias & télémétrie",
      roadmap_meta_title: "Roadmap — Anime Episode Tracker",
      roadmap_meta_description: "Roadmap simple et visuelle : ce qui arrive maintenant, ensuite et plus tard.",
      roadmap_title: "Ce qui arrive",
      roadmap_intro: "Une vue claire sur les fonctionnalités en cours, celles qui arrivent ensuite et les idées sur lesquelles nous itérons.",
      roadmap_legend_now: "Now",
      roadmap_legend_next: "Next",
      roadmap_legend_later: "Later",
      roadmap_filter_all: "Tout",
      roadmap_filter_now: "Now",
      roadmap_filter_next: "Next",
      roadmap_filter_later: "Later",
      roadmap_now_label: "Now",
      roadmap_next_label: "Next",
      roadmap_later_label: "Later",
      roadmap_progress_estimate: "Avancement estimé",
      roadmap_progress_start: "Démarrage prévu",
      roadmap_now_speed_title: "Plus fluide au quotidien",
      roadmap_now_speed_desc: "Ouvertures rapides, retours visuels propres, tout reste clair pendant les rafraîchissements.",
      roadmap_now_speed_point1: "“Tout rafraîchir” lisible du début à la fin",
      roadmap_now_speed_point2: "Animations homogènes sur les cartes",
      roadmap_now_speed_point3: "États qui tiennent même en fermant le popup",
      roadmap_now_import_title: "Import / Export plus simple",
      roadmap_now_import_desc: "Importer, fusionner et retrouver facilement vos séries, sans prise de tête.",
      roadmap_now_import_point1: "Glisser-déposer",
      roadmap_now_import_point2: "Fusion claire des doublons",
      roadmap_now_import_point3: "Restauration sereine",
      roadmap_now_badge_title: "Badges <span class=\"badgeN\">+N</span> plus visibles",
      roadmap_now_badge_desc: "Un coup d’œil suffit : ce qui est nouveau ressort immédiatement.",
      roadmap_now_badge_point1: "Effet premium discret",
      roadmap_now_badge_point2: "Masquage par carte, qui persiste",
      roadmap_next_animesama_title: "AnimeSama",
      roadmap_next_animesama_desc: "L’intégration AnimeSama arrive : notifications VF/VOSTFR/VA et suivi complet de votre progression.",
      roadmap_next_animesama_point1: "Saisons reconnues automatiquement",
      roadmap_next_animesama_point2: "Notifications VF / VOSTFR / VA",
      roadmap_next_animesama_point3: "Passer S1 ⇄ S2 sans perdre le fil",
      roadmap_next_languages_title: "FR / EN impeccables",
      roadmap_next_languages_desc: "Tout s’affiche proprement, avec des dates qui “sonnent juste” selon la langue choisie.",
      roadmap_next_languages_point1: "Textes FR & EN harmonisés",
      roadmap_next_languages_point2: "Dates locales lisibles",
      roadmap_next_micro_title: "Micro-interactions",
      roadmap_next_micro_desc: "Des transitions fines qui donnent une sensation de qualité sans en faire trop.",
      roadmap_next_micro_point1: "Hover/press élégants",
      roadmap_next_micro_point2: "Feedback clair à chaque action",
      roadmap_later_notes_title: "Notes & favoris",
      roadmap_later_notes_desc: "Garder sous la main vos séries clés et un petit pense-bête par titre.",
      roadmap_later_notes_point1: "Favoris en tête de liste",
      roadmap_later_notes_point2: "Mini-note par série",
      roadmap_later_reminders_title: "Rappels souples",
      roadmap_later_reminders_desc: "Un rappel doux si vous avez manqué plusieurs sorties d’affilée.",
      roadmap_later_reminders_point1: "Rappel ponctuel, pas envahissant",
      roadmap_later_home_title: "Accueil personnalisé",
      roadmap_later_home_desc: "Un premier écran qui s’adapte à vos habitudes.",
      roadmap_later_home_point1: "Accès direct à l’essentiel",
      roadmap_empty: "Le chargement de la roadmap a échoué. Réessayez dans quelques instants.",
      roadmap_title_soon: "Roadmap bientôt disponible",
      roadmap_intro_soon: "Nous finalisons actuellement la roadmap publique. Revenez prochainement pour découvrir les prochaines étapes."
    },
    en: {
      brand_title: "Anime Episode Tracker",
      nav_primary: "Primary navigation",
      nav_home: "Home",
      nav_roadmap: "Roadmap",
      nav_privacy: "Data privacy",
      nav_install: "Install",
      skip_to_content: "Skip to content",
      lang_switch_label: "Change language",
      lang_option_fr: "French",
      lang_option_en: "English",
      hero_title: "Never miss a single episode.",
      index_meta_title: "Anime Episode Tracker",
      index_meta_description: "Never miss a release. VF/VOSTFR alerts. Simple. Accurate. Polished.",
      hero_sub: "The extension spots new VF and VOSTFR episodes and notifies you within seconds. No complex setup: open your usual sites and keep following your list.",
      hero_cta_install: "Install on Chrome",
      hero_cta_feedback: "Report a bug",
      hero_note: "Zero tracking • Data stays local",
      providers_title: "Supported websites",
      providers_sub: "We keep an eye on your anime platforms and highlight what’s new. Here is what’s already live and what’s coming next.",
      provider_voiranime_title: "VoirAnime",
      provider_status_live: "Available",
      provider_voiranime_desc: "Once you open an episode page, a “Follow” button lets you add it straight into the extension.",
      provider_voiranime_hint: "Click to open the VoirAnime preview.",
      provider_animesama_title: "AnimeSama",
      provider_status_soon: "In preparation",
      provider_animesama_desc: "AnimeSama support is on the way: VF/VOSTFR/VA notifications, progress backup, and manga scan tracking are almost ready.",
      provider_media_title: "VoirAnime integration preview",
      provider_media_empty: "Add your media to see it here.",
      provider_media_video_label: "Video",
      provider_media_image_label: "Image",
      media_lightbox_close: "Close",
      media_title: "Extension previews",
      media_images: "Screenshots",
      media_videos: "Demo videos",
      features_title: "Features",
      feature_alerts_title: "Instant alerts",
      feature_alerts_desc: "Get notified as soon as a new VF or VOSTFR episode drops. You instantly know what to watch.",
      feature_seasons_title: "All your seasons",
      feature_seasons_desc: "The extension tracks every season automatically—no spreadsheets to maintain, just an up-to-date watchlist.",
      feature_badge_title: "<span class=\"badgeN\">+N</span> badges",
      feature_badge_desc: "The <span class=\"badgeN\">+N</span> badge highlights how many episodes you’re behind. Hide it whenever you’re caught up.",
      feature_refresh_title: "Simple refresh",
      feature_refresh_desc: "One click refreshes every card. The button greys out while scanning so you know it’s working.",
      feature_language_title: "Clear languages & dates",
      feature_language_desc: "Texts adapt to French or English and dates automatically use the right locale.",
      feature_integration_title: "VoirAnime integration",
      feature_integration_desc: "An “Add” button appears on VoirAnime titles so you can follow an anime without leaving the page.",
      footer_install: "Install",
      footer_feedback: "Report a bug",
      footer_note: "Anime Episode Tracker — Not affiliated with VoirAnime/MAL",
      footer_disclaimer: "Not affiliated with VoirAnime/MyAnimeList",
      support_title: "Need a hand?",
      support_intro: "Spotted something odd or want a deeper audit? Let us know in a few clicks.",
      support_intro_simple:
        "Spotted suspicious behavior or have improvement ideas? Tell us in a few minutes by filling the appropriate form.",
      support_cta_bug: "Report a bug",
      support_cta_ideas: "Suggestions & improvements",
      support_cta_bug_label: "Open the bug report form",
      support_cta_ideas_label: "Open the suggestions and improvements form",
      reviews_title: "Chrome Web Store reviews",
      reviews_subtitle: "Latest verified feedback, refreshed automatically.",
      reviews_metric_rating: "Average rating",
      reviews_metric_rating_aria: "Average rating {{value}} out of 5",
      reviews_metric_users: "Users",
      reviews_metric_users_aria: "{{value}} users",
      reviews_metric_reviews: "Reviews",
      reviews_metric_reviews_aria: "{{value}} reviews",
      reviews_store_cta: "See on the Chrome Web Store",
      privacy_meta_title: "Data privacy — Anime Episode Tracker",
      privacy_meta_description: "No telemetry. Local-only data. Minimal permissions.",
      privacy_title: "Data <strong>privacy</strong>",
      privacy_intro: "We collect nothing, your data stays with you, and you remain in control at all times.",
      privacy_card_local_title: "No telemetry",
      privacy_card_local_desc: "No tracking, no analytics. The extension never sends personal data or usage stats to any server.",
      privacy_card_local_point1: "Your watchlist, seen episodes, and settings live in <code>chrome.storage.local</code>.",
      privacy_card_local_point2: "No hidden sync: no profiling, no ads.",
      privacy_card_permissions_title: "Minimal permissions",
      privacy_card_permissions_desc: "Every permission is explained before install and only exists to watch for new episodes.",
      privacy_perm_storage_name: "Storage",
      privacy_perm_storage_desc: "Keeps your data inside the browser.",
      privacy_perm_alarms_name: "Alarms",
      privacy_perm_alarms_desc: "Schedules the episode checks.",
      privacy_perm_notifications_name: "Notifications",
      privacy_perm_notifications_desc: "Shows system alerts when new episodes are available.",
      privacy_perm_sites_name: "VoirAnime access",
      privacy_perm_sites_desc: "Read-only access to detect the shows you follow.",
      privacy_card_control_title: "Full control",
      privacy_card_control_desc: "Export, back up, or wipe your data in one click from the settings.",
      privacy_card_control_point1: "JSON export so you can recover your shows anytime.",
      privacy_card_control_point2: "Safe import merges existing data without duplicates.",
      privacy_card_control_point3: "Factory reset available directly in the options.",
      privacy_card_media_title: "Images & visuals",
      privacy_card_media_desc: "Anime posters are loaded as blobs to avoid hotlinking and respect source bandwidth.",
      privacy_card_media_point1: "Visuals are cached locally.",
      privacy_card_media_point2: "They’re removed automatically when you reset the extension.",
      privacy_toc_nav: "Summary",
      privacy_toc_local: "Local data",
      privacy_toc_permissions: "Permissions",
      privacy_toc_control: "Control & deletion",
      privacy_toc_media: "Media & telemetry",
      roadmap_meta_title: "Roadmap — Anime Episode Tracker",
      roadmap_meta_description: "A simple visual roadmap: what’s in progress now, what’s next, and what comes later.",
      roadmap_title: "What’s next",
      roadmap_intro: "A clear view of what’s in progress, what’s coming afterwards, and the ideas we’re exploring.",
      roadmap_legend_now: "Now",
      roadmap_legend_next: "Next",
      roadmap_legend_later: "Later",
      roadmap_filter_all: "All",
      roadmap_filter_now: "Now",
      roadmap_filter_next: "Next",
      roadmap_filter_later: "Later",
      roadmap_now_label: "Now",
      roadmap_next_label: "Next",
      roadmap_later_label: "Later",
      roadmap_progress_estimate: "Progress estimate",
      roadmap_progress_start: "Planned start",
      roadmap_now_speed_title: "Smoother everyday flow",
      roadmap_now_speed_desc: "Faster openings, clean visual feedback, and clarity during refreshes.",
      roadmap_now_speed_point1: "Readable “Refresh all” from start to finish",
      roadmap_now_speed_point2: "Consistent card animations",
      roadmap_now_speed_point3: "States persist even if you close the popup",
      roadmap_now_import_title: "Easier import / export",
      roadmap_now_import_desc: "Import, merge, and find your shows effortlessly.",
      roadmap_now_import_point1: "Drag & drop",
      roadmap_now_import_point2: "Clear duplicate merging",
      roadmap_now_import_point3: "Stress-free restores",
      roadmap_now_badge_title: "Sharper <span class=\"badgeN\">+N</span> badges",
      roadmap_now_badge_desc: "New episodes stand out at a glance.",
      roadmap_now_badge_point1: "Subtle premium glow",
      roadmap_now_badge_point2: "Per-card hide option that sticks",
      roadmap_next_animesama_title: "AnimeSama",
      roadmap_next_animesama_desc: "AnimeSama integration is coming: VF/VOSTFR/VA notifications and full progress tracking.",
      roadmap_next_animesama_point1: "Seasons detected automatically",
      roadmap_next_animesama_point2: "VF / VOSTFR / VA alerts",
      roadmap_next_animesama_point3: "Jump S1 ⇄ S2 without losing context",
      roadmap_next_languages_title: "Polished FR / EN",
      roadmap_next_languages_desc: "Everything lines up nicely with dates that “feel right” for the selected language.",
      roadmap_next_languages_point1: "Harmonised FR & EN wording",
      roadmap_next_languages_point2: "Readable localised dates",
      roadmap_next_micro_title: "Micro interactions",
      roadmap_next_micro_desc: "Fine transitions for a premium feel without overdoing it.",
      roadmap_next_micro_point1: "Elegant hover/press states",
      roadmap_next_micro_point2: "Clear feedback on every action",
      roadmap_later_notes_title: "Notes & favourites",
      roadmap_later_notes_desc: "Keep key shows close with a quick memo per title.",
      roadmap_later_notes_point1: "Pinned favourites at the top",
      roadmap_later_notes_point2: "Mini note per series",
      roadmap_later_reminders_title: "Gentle reminders",
      roadmap_later_reminders_desc: "A soft nudge if you’ve missed several releases in a row.",
      roadmap_later_reminders_point1: "Occasional reminder, never spammy",
      roadmap_later_home_title: "Personalised home",
      roadmap_later_home_desc: "A first screen tailored to your habits.",
      roadmap_later_home_point1: "Direct access to what matters",
      roadmap_empty: "We couldn’t load the roadmap. Please try again shortly.",
      roadmap_title_soon: "Roadmap coming soon",
      roadmap_intro_soon: "We’re putting the final touches on the public roadmap. Check back soon to see what’s next."
    }
  };

  const format = (text = "") => text.replace(/{{(\w+)}}/g, (_, key) => dynamicValues[key] ?? "");
  let currentLang = fallbackLang;

  const updateLanguageControls = (lang) => {
    document.querySelectorAll("[data-lang-switcher]").forEach(select => {
      if (select.value !== lang) {
        select.value = lang;
      }
    });

    document.querySelectorAll(".lang-item[data-lang]").forEach(button => {
      const isActive = button.dataset.lang === lang;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const applyTranslations = (lang) => {
    const dict = translations[lang] || translations[fallbackLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const value = dict[key];
      if (!value) return;
      const attr = el.getAttribute("data-i18n-attr");
      const formatted = format(value);
      if (attr) {
        if (attr === "text") {
          el.textContent = formatted;
        } else {
          el.setAttribute(attr, formatted);
        }
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value = formatted;
      } else {
        el.innerHTML = formatted;
      }
    });

    document.documentElement.lang = lang;
    localStorage.setItem(storageKey, lang);
    currentLang = lang;
    updateLanguageControls(lang);

    const changeLanguage = (value) => {
      const target = translations[value] ? value : fallbackLang;
      if (target === currentLang) {
        updateLanguageControls(target);
        return;
      }
      applyTranslations(target);
    };

    window.AET_I18N = {
      t(key) {
        const table = translations[currentLang] || translations[fallbackLang];
        return format(table?.[key] ?? "");
      },
      lang: currentLang,
      setLang: changeLanguage
    };
    document.dispatchEvent(new CustomEvent("lang:changed", { detail: { lang } }));
  };

  const init = () => {
    const stored = localStorage.getItem(storageKey);
    const initial = translations[stored] ? stored : fallbackLang;
    document.querySelectorAll("[data-lang-switcher]").forEach(select => {
      select.value = initial;
      select.addEventListener("change", (event) => {
        const value = event.target.value;
        const target = translations[value] ? value : fallbackLang;
        applyTranslations(target);
      });
    });

    applyTranslations(initial);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
