(function () {
  const manifest = {
    // Mettre à jour ce fichier pour changer toutes les images du site.
    previews: {
      // Déposez vos captures dans assets/previews/ puis renseignez les chemins ci-dessous.
      popup: "",
      injection: "Import.mp4",
      settings: "",
      notification: ""
    },
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

  window.MEDIA_MANIFEST = manifest;
  window.PROVIDER_MEDIA_MANIFESTS = Object.assign(
    window.PROVIDER_MEDIA_MANIFESTS || {},
    manifest.providers || {}
  );
})();
