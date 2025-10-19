window.MEDIA_MANIFEST = {
  previews: [
    { src: "assets/previews/Page_pincipal.png", alt: "Accueil extension", caption_key: "media_cap_home" },
    { src: "assets/previews/Parametre.png", alt: "Page des paramètres", caption_key: "media_cap_settings" },
    { src: "assets/previews/Import_card.mkv", alt: "Ajout automatique d’épisodes", type: "video", caption_key: "media_cap_import" },
    { src: "assets/previews/scroll_DnD.mkv", alt: "DnD des cartes", type: "video", caption_key: "media_cap_scroll" },
    { src: "assets/previews/Tutoriel.mkv", alt: "Tutoriel de l'extension", type: "video", caption_key: "media_cap_tutorial" }
  ],
  providers: {
    VoirAnime: {
      videos: [],
      images: [
        "1-Demon_Slayer.png",
        "2-Demon_Slayer.png"
      ]
    }
  }
};

window.PROVIDER_MEDIA_MANIFESTS = Object.assign(
  window.PROVIDER_MEDIA_MANIFESTS || {},
  window.MEDIA_MANIFEST.providers || {}
);
