async function loadInvitation() {
  const response = await fetch("data/config.json", { cache: "no-store" });
  const config = await response.json();

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  };

  setText("title", config.message.title);
  setText("groom", config.couple.groom);
  setText("bride", config.couple.bride);
  setText("intro", config.message.intro);
  setText("closing", config.message.closing);
  setText("displayDate", config.event.displayDate);
  setText("time", config.event.time);
  setText("venue", config.event.venue);
  setText("address", config.event.address);

  if (config.media.heroPhoto) {
    document.getElementById("heroImage").style.backgroundImage =
      `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.46)), url("${config.media.heroPhoto}")`;
  }

  const gallery = document.getElementById("gallery");
  const gallerySection = document.getElementById("gallerySection");
  if (Array.isArray(config.media.gallery) && config.media.gallery.length > 0) {
    gallerySection.hidden = false;
    gallery.replaceChildren(
      ...config.media.gallery.map((src, index) => {
        const image = document.createElement("img");
        image.src = src;
        image.alt = `웨딩 사진 ${index + 1}`;
        image.loading = "lazy";
        return image;
      })
    );
  }

  const bgm = document.getElementById("bgm");
  const musicButton = document.getElementById("musicButton");
  if (config.media.bgm) {
    bgm.src = config.media.bgm;
    musicButton.hidden = false;
    musicButton.addEventListener("click", async () => {
      if (bgm.paused) {
        await bgm.play();
        musicButton.textContent = "음악 정지";
      } else {
        bgm.pause();
        musicButton.textContent = "음악 재생";
      }
    });
  }
}

loadInvitation().catch((error) => {
  console.error("Failed to load invitation config", error);
});
