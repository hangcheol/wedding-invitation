async function loadInvitation() {
  const response = await fetch("data/config.json", { cache: "no-store" });
  const config = await response.json();

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && value) element.textContent = value;
  };

  const heroPhoto = config.media.heroPhoto || "";
  const galleryPhotos = Array.isArray(config.media.gallery) ? config.media.gallery : [];
  const groomPhoto = config.media.groomPhoto || galleryPhotos[0] || heroPhoto;
  const bridePhoto = config.media.bridePhoto || galleryPhotos[1] || heroPhoto;
  const secondPhoto = galleryPhotos[2] || galleryPhotos[0] || heroPhoto;
  const venuePhoto = config.media.venuePhoto || galleryPhotos[3] || secondPhoto;

  const setBackground = (id, src, overlay = true) => {
    const element = document.getElementById(id);
    if (!element || !src) return;
    const gradient = overlay ? "linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.34)), " : "";
    element.style.backgroundImage = `${gradient}url("${src}")`;
  };

  setText("groom", config.couple.groom);
  setText("bride", config.couple.bride);
  setText("groomNameTop", config.couple.groom);
  setText("brideNameTop", config.couple.bride);
  setText("groomEnd", config.couple.groom);
  setText("brideEnd", config.couple.bride);
  setText("intro", config.message.intro);
  setText("closing", config.message.closing);
  setText("displayDate", config.event.displayDate);
  setText("time", config.event.time);
  setText("venue", config.event.venue);
  setText("address", config.event.address);
  setText("coverCaption", config.message.coverCaption || "우리 이름 적힌 이 길 위로");
  setText("coverDate", config.event.coverDate || config.event.displayDate);
  setText("coverQuote", config.message.coverQuote || "Forever begins with a single step,\nand love guides us every step of the way.");
  setText("groomStory", config.profile?.groomStory);
  setText("brideStory", config.profile?.brideStory);
  setText("groomTag", config.profile?.groomTag);
  setText("brideTag", config.profile?.brideTag);

  setBackground("heroImage", heroPhoto, false);
  setBackground("stripImage", heroPhoto);
  setBackground("secondImage", secondPhoto);
  setBackground("groomPhoto", groomPhoto, false);
  setBackground("bridePhoto", bridePhoto, false);
  setBackground("venueImage", venuePhoto, false);
  renderCalendar(config.event.date);

  const gallery = document.getElementById("gallery");
  const gallerySection = document.getElementById("gallerySection");
  if (galleryPhotos.length > 0) {
    gallerySection.hidden = false;
    gallery.replaceChildren(
      ...galleryPhotos.map((src, index) => {
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
        musicButton.classList.add("is-playing");
      } else {
        bgm.pause();
        musicButton.classList.remove("is-playing");
      }
    });
  }

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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
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

loadInvitation().catch((error) => {
  console.error("Failed to load invitation config", error);
});
