function visitNoticeItems(notice = {}) {
  return (Array.isArray(notice.items) ? notice.items : [])
    .filter((item) => item && item.enabled !== false)
    .map((item) => ({
      title: String(item.title || "").trim(),
      time: String(item.time || "").trim(),
      body: String(item.body || "").trim(),
      parkingDetails: item.parkingDetails === true
    }))
    .filter((item) => item.title && (item.time || item.body));
}

function setupVisitNotice(notice = {}) {
  const card = document.getElementById("visitNoticeSection");
  const reopen = document.getElementById("visitNoticeReopen");
  const dialog = document.getElementById("visitNoticeDialog");
  const items = visitNoticeItems(notice);
  const visible = notice.enabled === true && items.length > 0;
  card.hidden = reopen.hidden = !visible;
  if (!visible) return;

  const title = notice.title || "사전에 확인해 주세요";
  document.getElementById("visitNoticeTitle").textContent = title;
  document.getElementById("visitNoticeDialogTitle").textContent = title;
  for (const id of ["visitNoticeIntro", "visitNoticeDialogIntro"]) {
    document.getElementById(id).textContent = notice.intro || "";
  }
  document.getElementById("visitNoticeClosing").textContent = notice.closing || "";

  function renderItems(containerId, detailed) {
    const container = document.getElementById(containerId);
    container.replaceChildren(...items.map((item) => {
      const article = document.createElement("article");
      const heading = document.createElement("h3");
      heading.textContent = item.title;
      article.append(heading);
      const summary = document.createElement("p");
      summary.className = "visit-notice__time multiline-copy";
      summary.textContent = item.time || item.body;
      article.append(summary);
      if (detailed && item.body && item.time) {
        const body = document.createElement("p");
        body.className = "visit-notice__body multiline-copy";
        body.textContent = item.body;
        article.append(body);
      }
      return article;
    }));
  }
  renderItems("visitNoticeSummary", false);
  renderItems("visitNoticeDetails", true);

  const parking = document.getElementById("visitNoticeParking");
  const source = document.getElementById("dayParkingSection");
  parking.hidden = !source || source.hidden || !items.some((item) => item.parkingDetails);
  let opener;
  let oldOverflow;
  const open = (event) => {
    if (dialog.open) return;
    // Copy current parking content on opening; IDs and reveal effects stay unique.
    const content = document.getElementById("visitNoticeParkingContent");
    content.replaceChildren();
    if (!parking.hidden) {
      const clone = source.cloneNode(true);
      clone.removeAttribute("id");
      clone.className = "visit-notice__parking-content";
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.querySelectorAll(".slide-item").forEach((el) => el.classList.remove("slide-item"));
      content.append(clone);
    }
    opener = event?.currentTarget || reopen;
    oldOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
  };
  document.getElementById("visitNoticeOpen").addEventListener("click", open);
  reopen.addEventListener("click", open);
  document.getElementById("visitNoticeClose").addEventListener("click", () => dialog.close());
  document.getElementById("visitNoticeDone").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.style.overflow = oldOverflow;
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  if (notice.autoOpen === true) open();
}
