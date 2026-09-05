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

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

const TEMPLATES = new Set(["editorial", "paper-story"]);
const PROTECTED_MEDIA_SELECTOR = "img, video, .photo-slot";

function protectMedia() {
  document.querySelectorAll("img, video").forEach((element) => {
    element.draggable = false;
  });

  ["contextmenu", "dragstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(PROTECTED_MEDIA_SELECTOR)) event.preventDefault();
    });
  });
}

function showStaticIntro() {
  const video = document.querySelector(".paper-intro__media");
  document.documentElement.classList.add("intro-media-static");
  if (video) video.pause();
}

function setupIntroMedia() {
  const video = document.querySelector(".paper-intro__media");
  if (!video) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showStaticIntro();
    return;
  }

  video.addEventListener("ended", () => {
    showStaticIntro();
  }, { once: true });

  const playback = video.play();
  if (playback) playback.catch(showStaticIntro);
}

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
  const introDisabled = config.design?.introAnimation === false;
  document.documentElement.classList.toggle("no-paper-intro", introDisabled);
  if (introDisabled) showStaticIntro();
  const sections = config.sections || {};
  const isEnabled = (name) => sections[name] !== false;

  const galleryPhotos = Array.isArray(config.media.gallery) ? config.media.gallery : [];
  const heroPhoto = config.media.heroPhoto || "";
  const invitationPhoto = config.media.invitationPhoto || "";
  const groomPhoto = config.media.groomPhoto || "";
  const bridePhoto = config.media.bridePhoto || "";
  const venuePhoto = config.media.venuePhoto || "";
  const parkingPhoto = config.media.parkingPhoto || "";

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
  const paperCoverNames = document.getElementById("paperCoverNames");
  if (paperCoverNames) {
    paperCoverNames.hidden = config.design?.coverNamesVisible === false;
    paperCoverNames.style.setProperty("--cover-names-top", `${clampNumber(config.design?.coverNamesTop, 20, 72, 35)}%`);
    paperCoverNames.style.setProperty("--cover-names-size", `${clampNumber(config.design?.coverNamesSize, 11, 24, 16)}px`);
  }
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
  setupContacts(config.contact || {});
  setupAccounts(config.accounts || {}, isEnabled("accounts"));
  setupDirections(config);
  setupGuestbook(config.guestbook || {}, isEnabled("guestbook"));
}

const DEFAULT_SECTION_ORDER = ["invitation", "photo", "details", "directions", "gallery", "profile", "parking", "accounts", "guestbook"];
const SECTION_ELEMENT_IDS = {
  invitation: "invitationSection",
  photo: "paperPhotoSection",
  profile: "profileSection",
  details: "details",
  directions: "directionsSection",
  parking: "parkingSection",
  gallery: "gallerySection",
  accounts: "accountsSection",
  guestbook: "guestbookSection"
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
  const naverLink = document.getElementById("naverMapLink");
  const naverSearchUrl = directions.naverUrl || `https://map.naver.com/p/search/${encodeURIComponent(query)}`;

  setText("directionsVenue", config.event.venue);
  setText("directionsAddress", address);
  setText("directionsNote", directions.note);

  if (kakaoLink) kakaoLink.href = `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
  if (naverLink) naverLink.href = naverSearchUrl;
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

function setupContacts(contact) {
  const actions = document.getElementById("contactActions");
  if (!actions) return;

  const contacts = [
    ["groomContact", "신랑에게 연락", contact.groomPhone],
    ["brideContact", "신부에게 연락", contact.bridePhone]
  ].filter(([, , phone]) => String(phone || "").trim());

  contacts.forEach(([id, label, phone]) => {
    const link = document.getElementById(id);
    if (!link) return;
    link.href = `tel:${String(phone).replace(/[^+\d]/g, "")}`;
    link.textContent = label;
    link.hidden = false;
  });
  actions.hidden = contacts.length === 0;
}

function safePaymentUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function setupAccounts(accounts, enabled) {
  const section = document.getElementById("accountsSection");
  const list = document.getElementById("accountsList");
  if (!section || !list || !enabled) return;

  setOptionalText("accountsIntro", accounts.intro);
  const sides = [
    ["신랑측", "신랑", accounts.groom],
    ["신부측", "신부", accounts.bride]
  ];
  list.replaceChildren();

  sides.forEach(([sideLabel, defaultLabel, value]) => {
    const source = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
    const recipients = source.map((account) => ({
      label: String(account.label || defaultLabel).trim(),
      bank: String(account.bank || "").trim(),
      number: String(account.number || "").trim(),
      holder: String(account.holder || "").trim(),
      kakaoPayUrl: safePaymentUrl(account.kakaoPayUrl)
    })).filter((account) => account.bank && account.number && account.holder);
    if (!recipients.length) return;

    const group = document.createElement("details");
    group.className = "account-group";
    const summary = document.createElement("summary");
    const title = document.createElement("span");
    const count = document.createElement("small");
    title.textContent = sideLabel;
    count.textContent = `${recipients.length}명`;
    summary.append(title, count);

    const body = document.createElement("div");
    body.className = "account-group__body";
    recipients.forEach((account) => {
      const card = document.createElement("div");
      card.className = "account-card";
      const holder = document.createElement("p");
      holder.className = "account-card__holder";
      holder.textContent = `${account.label || defaultLabel} · 예금주 ${account.holder}`;
      const number = document.createElement("p");
      number.className = "account-card__number";
      number.textContent = `${account.bank} ${account.number}`;

      const actions = document.createElement("div");
      actions.className = `account-card__actions${account.kakaoPayUrl ? "" : " is-copy-only"}`;
      const copyButton = document.createElement("button");
      copyButton.className = "account-copy";
      copyButton.type = "button";
      copyButton.textContent = "계좌번호 복사";
      copyButton.addEventListener("click", async () => {
        try {
          await copyText(account.number.replace(/\s/g, ""));
          copyButton.textContent = "복사되었습니다";
        } catch {
          copyButton.textContent = "복사하지 못했습니다";
        }
        window.setTimeout(() => { copyButton.textContent = "계좌번호 복사"; }, 1600);
      });
      actions.append(copyButton);

      if (account.kakaoPayUrl) {
        const paymentLink = document.createElement("a");
        paymentLink.className = "account-kakaopay";
        paymentLink.href = account.kakaoPayUrl;
        paymentLink.target = "_blank";
        paymentLink.rel = "noreferrer";
        paymentLink.textContent = "카카오페이 송금";
        actions.append(paymentLink);
      }
      card.append(holder, number, actions);
      body.append(card);
    });
    group.append(summary, body);
    list.append(group);
  });

  section.hidden = list.childElementCount === 0;
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
  const images = galleryPhotos.map((src, index) => {
      const image = document.createElement("img");
      image.className = "slide-item";
      image.src = src;
      image.alt = `웨딩 사진 ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.draggable = false;
      image.width = 360;
      image.height = 450;
      if (index >= 8) image.hidden = true;
      return image;
    });
  gallery.replaceChildren(...images);

  const moreButton = document.getElementById("galleryMoreButton");
  if (!moreButton || galleryPhotos.length <= 8) {
    return;
  }

  let expanded = false;
  moreButton.hidden = false;
  moreButton.textContent = `사진 더보기 (${galleryPhotos.length - 8})`;
  moreButton.addEventListener("click", () => {
    const anchorTop = moreButton.getBoundingClientRect().top;
    expanded = !expanded;
    images.slice(8).forEach((image) => { image.hidden = !expanded; });
    moreButton.textContent = expanded ? "사진 접기" : `사진 더보기 (${galleryPhotos.length - 8})`;
    moreButton.setAttribute("aria-expanded", String(expanded));
    if (!expanded) {
      requestAnimationFrame(() => {
        const scrollRoot = document.documentElement;
        const previousBehavior = scrollRoot.style.scrollBehavior;
        scrollRoot.style.scrollBehavior = "auto";
        window.scrollBy(0, moreButton.getBoundingClientRect().top - anchorTop);
        requestAnimationFrame(() => { scrollRoot.style.scrollBehavior = previousBehavior; });
      });
    }
  });
}

function setupGuestbook(settings, enabled) {
  const section = document.getElementById("guestbookSection");
  const form = document.getElementById("guestbookForm");
  const list = document.getElementById("guestbookList");
  const moreButton = document.getElementById("guestbookMoreButton");
  if (!section || !form || !list || !moreButton || !enabled) return;

  let apiUrl;
  try {
    apiUrl = new URL(settings.apiUrl || "https://admin.hamyeon.com/api/guestbook");
    if (apiUrl.protocol !== "https:") throw new Error("Guestbook API must use HTTPS");
  } catch {
    return;
  }
  section.hidden = false;
  setOptionalText("guestbookIntro", settings.intro || "두 사람의 앞날을 축복하는 따뜻한 마음을 남겨주세요.");
  const status = document.getElementById("guestbookStatus");
  const messageInput = document.getElementById("guestbookMessage");
  const count = document.getElementById("guestbookCount");
  let messages = [];
  let visibleCount = 6;

  const render = () => {
    list.replaceChildren();
    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "guestbook-empty";
      empty.textContent = "첫 번째 축하 메시지를 남겨주세요.";
      list.append(empty);
    } else {
      messages.slice(0, visibleCount).forEach((entry) => {
        const article = document.createElement("article");
        article.className = "guestbook-entry";
        const head = document.createElement("div");
        const name = document.createElement("strong");
        const date = document.createElement("time");
        name.textContent = entry.name;
        date.dateTime = entry.createdAt;
        const parsedDate = new Date(entry.createdAt);
        date.textContent = Number.isNaN(parsedDate.getTime()) ? "" : new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(parsedDate);
        head.append(name, date);
        const message = document.createElement("p");
        message.textContent = entry.message;
        article.append(head, message);
        list.append(article);
      });
    }
    moreButton.hidden = messages.length <= visibleCount;
  };

  const load = async () => {
    try {
      const response = await fetch(apiUrl, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      messages = Array.isArray(result.messages) ? result.messages : [];
      render();
    } catch {
      list.innerHTML = '<p class="guestbook-empty">방명록을 잠시 불러오지 못했습니다.</p>';
    }
  };

  messageInput?.addEventListener("input", () => { count.textContent = `${messageInput.value.length} / 300`; });
  moreButton.addEventListener("click", () => { visibleCount += 6; render(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    status.textContent = "마음을 전하고 있습니다…";
    try {
      const data = new FormData(form);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries()))
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      messages.unshift(result.message);
      form.reset();
      count.textContent = "0 / 300";
      status.textContent = "따뜻한 마음이 등록되었습니다.";
      visibleCount = Math.max(visibleCount, 6);
      render();
    } catch (error) {
      status.textContent = error.message || "등록하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    } finally {
      submitButton.disabled = false;
    }
  });
  load();
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
  const topButton = document.getElementById("topButton");
  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  const updateTopButton = () => topButton.classList.toggle("is-visible", window.scrollY > 700);
  window.addEventListener("scroll", updateTopButton, { passive: true });
  updateTopButton();

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

protectMedia();
setupIntroMedia();
setupReveal();

loadInvitation().catch((error) => {
  console.error("Failed to load invitation config", error);
});
