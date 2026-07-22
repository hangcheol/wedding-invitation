function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) element.textContent = value;
}

function setOptionalText(id, value, { parentheses = false } = {}) {
  const element = document.getElementById(id);
  if (!element) return;
  const text = String(value || "").trim();
  element.textContent = text ? (parentheses ? `(${text.replace(/^\(|\)$/g, "")})` : text) : "";
  element.hidden = !text;
}

const TEMPLATES = new Set(["editorial", "paper-story"]);

function resolveTemplate(config) {
  const preview = new URLSearchParams(window.location.search).get("previewTemplate");
  if (TEMPLATES.has(preview)) return preview;
  const selected = config.design?.template;
  return TEMPLATES.has(selected) ? selected : "editorial";
}

function setPhotoBackground(id, src, { overlay = false, eager = false } = {}) {
  const element = document.getElementById(id);
  if (!element) return;
  if (!src) {
    element.classList.add("is-empty");
    return;
  }

  const gradient = overlay ? "linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.28)), " : "";
  const apply = () => {
    element.style.backgroundImage = `${gradient}url("${src}")`;
    element.classList.add("is-loaded");
  };

  if (eager || !("IntersectionObserver" in window)) {
    apply();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    apply();
    observer.disconnect();
  }, { rootMargin: "320px 0px" });
  observer.observe(element);
}

async function loadInvitation() {
  const response = await fetch("data/config.json", { cache: "no-store" });
  const config = await response.json();
  const template = resolveTemplate(config);
  document.documentElement.dataset.template = template;
  document.documentElement.classList.toggle("no-paper-intro", config.design?.introAnimation === false);
  const sections = config.sections || {};
  const isEnabled = (name) => sections[name] !== false;

  const galleryPhotos = Array.isArray(config.media.gallery) ? config.media.gallery : [];
  const heroPhoto = config.media.heroPhoto || "";
  const invitationPhoto = config.media.invitationPhoto || galleryPhotos[0] || "";
  const groomPhoto = config.media.groomPhoto || galleryPhotos[1] || "";
  const bridePhoto = config.media.bridePhoto || galleryPhotos[2] || "";
  const venuePhoto = config.media.venuePhoto || galleryPhotos[3] || "";
  const parkingPhoto = config.media.parkingPhoto || galleryPhotos[4] || "";

  setText("groom", config.couple.groom);
  setText("bride", config.couple.bride);
  setText("groomNameTop", config.couple.groom);
  setText("brideNameTop", config.couple.bride);
  setText("groomCover", config.couple.groom);
  setText("brideCover", config.couple.bride);
  setText("paperGroom", config.couple.groom);
  setText("paperBride", config.couple.bride);
  setText("groomEnd", config.couple.groom);
  setText("brideEnd", config.couple.bride);
  setText("paperCoverNames", config.message.coverNames || `${config.couple.bride}과 ${config.couple.groom}`);
  setText("intro", config.message.intro);
  setText("closing", config.message.closing);
  setText("displayDate", config.event.displayDate);
  setText("time", config.event.time);
  setText("venue", config.event.venue);
  setText("address", config.event.address);
  setText("coverDate", config.event.coverDate || config.event.displayDate);
  setText("coverQuote", config.message.coverQuote || "Forever begins with a single step,\nand love guides us every step of the way.");
  setText("groomStory", config.profile?.groomStory);
  setText("brideStory", config.profile?.brideStory);
  setText("groomTag", config.profile?.groomTag);
  setText("brideTag", config.profile?.brideTag);
  setOptionalText("groomQualifier", config.profile?.groomQualifier, { parentheses: true });
  setOptionalText("brideQualifier", config.profile?.brideQualifier, { parentheses: true });
  setOptionalText("profileTogether", config.profile?.togetherMessage);
  setText("parkingText", config.parking?.text);

  setPhotoBackground("heroImage", heroPhoto, { eager: template === "editorial" });
  setPhotoBackground("paperHeroImage", heroPhoto, { eager: false });
  setPhotoBackground("invitationImage", invitationPhoto, { overlay: true });
  setPhotoBackground("groomPhoto", groomPhoto);
  setPhotoBackground("bridePhoto", bridePhoto);
  setPhotoBackground("venueImage", venuePhoto);
  setPhotoBackground("parkingImage", parkingPhoto);
  setSectionVisibility("coverSection", isEnabled("cover"));
  setSectionVisibility("invitationSection", isEnabled("invitation"));
  setSectionVisibility("profileSection", isEnabled("profile"));
  setSectionVisibility("details", isEnabled("details"));
  setSectionVisibility("directionsSection", isEnabled("directions"));
  setSectionVisibility("parkingSection", isEnabled("parking"));
  setSectionVisibility("paperPhotoSection", template === "paper-story" && Boolean(heroPhoto));
  applySectionOrder(config.sections?.order, template);
  renderCalendar(config.event.date);
  renderGallery(galleryPhotos, isEnabled("gallery"));
  setupBgm(isEnabled("bgm") ? config.media.bgm : "");
  setupActions(config);
  setupDirections(config);
}

const DEFAULT_SECTION_ORDER = ["invitation", "photo", "details", "directions", "gallery", "profile", "parking"];
const SECTION_ELEMENT_IDS = {
  invitation: "invitationSection",
  photo: "paperPhotoSection",
  profile: "profileSection",
  details: "details",
  directions: "directionsSection",
  parking: "parkingSection",
  gallery: "gallerySection"
};

function applySectionOrder(savedOrder, template) {
  const valid = Array.isArray(savedOrder) ? savedOrder.filter((key) => DEFAULT_SECTION_ORDER.includes(key)) : [];
  const order = [...new Set([...valid, ...DEFAULT_SECTION_ORDER])];
  document.getElementById("coverSection")?.style.setProperty("order", "1");
  order.forEach((key, index) => {
    const element = document.getElementById(SECTION_ELEMENT_IDS[key]);
    if (element) element.style.setProperty("order", String(index + 2), "important");
  });
  document.querySelector(".ending")?.style.setProperty("order", String(order.length + 2));
  if (template !== "paper-story") document.getElementById("paperPhotoSection")?.style.removeProperty("order");
}

function setupDirections(config) {
  const directions = config.directions || {};
  const query = directions.query || [config.event.venue, config.event.address].filter(Boolean).join(" ");
  const address = config.event.address || "";
  const kakaoLink = document.getElementById("kakaoMapLink");
  const naverSearchUrl = directions.naverUrl || `https://map.naver.com/p/search/${encodeURIComponent(query)}`;

  setText("directionsVenue", config.event.venue);
  setText("directionsAddress", address);
  setText("directionsNote", directions.note);

  if (kakaoLink) kakaoLink.href = `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
  const naverOpenLink = document.getElementById("naverMapOpenLink");
  if (naverOpenLink) naverOpenLink.href = naverSearchUrl;
  setupNaverMap({
    enabled: document.getElementById("naverMapsApi")?.hasAttribute("src") === true,
    latitude: Number(directions.latitude) || 37.2865317,
    longitude: Number(directions.longitude) || 127.036915,
    fallbackUrl: naverSearchUrl
  });

  document.getElementById("copyAddressButton")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(address);
    const button = document.getElementById("copyAddressButton");
    if (!button) return;
    const original = button.textContent;
    button.textContent = "복사됨";
    window.setTimeout(() => { button.textContent = original; }, 1600);
  });
}

function waitForNaverMaps(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const maps = window.naver?.maps;
      if (maps?.Map && maps?.Marker && maps.jsContentLoaded !== false) {
        resolve(maps);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error("Naver Maps API is unavailable"));
        return;
      }
      window.setTimeout(check, 80);
    };
    check();
  });
}

function setupNaverMap({ enabled, latitude, longitude, fallbackUrl }) {
  const card = document.getElementById("naverMapCard");
  const canvas = document.getElementById("naverMap");
  const fallbackFrame = document.getElementById("fallbackMapFrame");
  const notice = document.getElementById("naverMapNotice");
  if (!card || !canvas) return;

  if (fallbackFrame) {
    const latitudeSpan = 0.0042;
    const longitudeSpan = 0.0062;
    const bbox = [
      longitude - longitudeSpan,
      latitude - latitudeSpan,
      longitude + longitudeSpan,
      latitude + latitudeSpan
    ].join(",");
    const params = new URLSearchParams({
      bbox,
      layer: "mapnik",
      marker: `${latitude},${longitude}`
    });
    fallbackFrame.src = `https://www.openstreetmap.org/export/embed.html?${params}`;
  }

  if (!enabled) {
    if (notice) notice.textContent = "지도에서 주변 위치를 확인하고 네이버지도로 크게 볼 수 있습니다.";
    return;
  }

  const activate = async () => {
    try {
      const maps = await waitForNaverMaps();
      const position = new maps.LatLng(latitude, longitude);
      const map = new maps.Map(canvas, {
        center: position,
        zoom: 17,
        minZoom: 10,
        zoomControl: true,
        zoomControlOptions: { position: maps.Position.TOP_RIGHT }
      });
      new maps.Marker({ map, position });
      card.classList.add("is-live");
      if (notice) {
        const link = document.createElement("a");
        link.href = fallbackUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = "네이버지도에서 크게 보기 ↗";
        notice.replaceChildren(link);
      }
    } catch (error) {
      console.warn("Naver map load failed", error);
      if (notice) notice.textContent = "지도에서 주변 위치를 확인하고 네이버지도로 크게 볼 수 있습니다.";
    }
  };

  if (!("IntersectionObserver" in window)) {
    activate();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    activate();
  }, { rootMargin: "360px 0px" });
  observer.observe(card);
}

function setSectionVisibility(id, visible) {
  const section = document.getElementById(id);
  if (section) section.hidden = !visible;
}

function renderGallery(galleryPhotos, enabled) {
  const gallery = document.getElementById("gallery");
  const gallerySection = document.getElementById("gallerySection");
  if (!gallery || !gallerySection || !enabled || galleryPhotos.length === 0) return;

  gallerySection.hidden = false;
  gallery.replaceChildren(
    ...galleryPhotos.map((src, index) => {
      const image = document.createElement("img");
      image.className = "slide-item";
      image.src = src;
      image.alt = `웨딩 사진 ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.width = 360;
      image.height = 450;
      return image;
    })
  );
}

function setupBgm(src) {
  const bgm = document.getElementById("bgm");
  const musicButton = document.getElementById("musicButton");
  if (!src || !bgm || !musicButton) return;

  bgm.src = src;
  musicButton.hidden = false;
  musicButton.addEventListener("click", async () => {
    if (bgm.paused) {
      await bgm.play();
      musicButton.classList.add("is-playing");
    } else {
      bgm.pause();
      musicButton.classList.remove("is-playing");
    }
  });
}

function setupActions(config) {
  document.getElementById("topButton").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("shareButton").addEventListener("click", async () => {
    const shareData = {
      title: "Wedding Invitation",
      text: `${config.couple.groom} & ${config.couple.bride}의 결혼식에 초대합니다.`,
      url: window.location.href
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("청첩장 주소를 복사했습니다.");
    }
  });
}

function setupReveal() {
  if (!("IntersectionObserver" in window)) return;

  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "-8% 0px -18% 0px", threshold: 0.18 }
  );

  document.documentElement.classList.add("has-reveal");
  elements.forEach((element) => observer.observe(element));
}

function renderCalendar(dateValue) {
  const calendar = document.getElementById("calendar");
  const eventDate = dateValue ? new Date(dateValue) : null;
  if (!calendar || Number.isNaN(eventDate?.getTime())) return;

  const year = eventDate.getFullYear();
  const month = eventDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const monthLabel = document.createElement("p");
  monthLabel.className = "calendar__month";
  monthLabel.textContent = `${month + 1}월`;

  const grid = document.createElement("div");
  grid.className = "calendar__grid";
  weekdayLabels.forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    grid.append(cell);
  });

  for (let index = 0; index < firstDay; index += 1) {
    grid.append(document.createElement("span"));
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const cell = document.createElement("span");
    cell.className = "is-day";
    cell.textContent = String(day);
    if (day === eventDate.getDate()) cell.classList.add("is-event");
    grid.append(cell);
  }

  calendar.replaceChildren(monthLabel, grid);
}

setupReveal();

loadInvitation().catch((error) => {
  console.error("Failed to load invitation config", error);
});
