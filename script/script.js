const CONFIG = {
  birthCode: "4514",
  defaultDate: "2026-06-15",
  defaultTime: "19:30",
  musicSrc: "assets/audio/music.mp3",
  images: {
    kiss: "assets/images/cats-kiss.svg",
    play: "assets/images/cats-play.svg",
    finale: "assets/images/finale.svg"
  },
  surprises: [
    { id: "kiss", emoji: "😘", label: "Сюрприз" },
    { id: "hearts", emoji: "🥰", label: "Сюрприз" },
    { id: "love", emoji: "😍", label: "Сюрприз" }
  ],
  texts: {
    hint: "Нажимайте кнопки в меню — пройдите приглашение целиком",
    brand: "♡ invitation ♡",
    pinTitle: "сумма даты нашего\nрождения\ndd.mm + dd.mm",
    pinHint: "4 цифры",
    pinWrong: "попробуй ещё раз 💗",
    questionTitle: "ты пойдешь со мной\nна свидание?",
    yesBtn: "Да",
    noBtn: "Нет (не принимается :)",
    noHint: "ну давай без этого 😌",
    saidNoTitle: "все таки нажали на нет???",
    saidNoBody: "Я же знаю, что да 😒😒 один раз хотя бы нажали\nТАК ЧТО ВЫ СОГЛАСНЫ?",
    agreeBtn: "Конечно согласен, любимая моя.",
    whenTitle: "и так... когда же мне\nждать мою любимку?",
    dateLabel: "Дата",
    timeLabel: "Время",
    cantWaitBtn: "ЖДУ НЕ ДОЖДУСЬ",
    surpriseTitle: "что посмотрим?",
    surpriseKicker: "СЮРПРИЗ",
    surpriseHint: "Может догадаетесь, не так уж\nи сложно",
    continueBtn: "Дальше ♡",
    finaleTitle: "рада что ты не\nотказался.",
    finaleBody: "Только бы сюрприз не\nоказался...",
    finaleReady: "Буду готова {date} в {time}!",
    needDateTime: "выбери дату и время 💗"
  }
};

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];
const MONTH_TITLES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const invitationState = {
  birthCode: "",
  accepted: false,
  date: CONFIG.defaultDate,
  time: CONFIG.defaultTime,
  surprise: null,
  currentStep: "pin"
};

const historyStack = [];
let noAttempts = 0;
let calendarCursor = parseISO(CONFIG.defaultDate);
let calendarDraft = CONFIG.defaultDate;
let musicReady = false;
let musicOn = false;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDot(iso) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function formatLong(iso) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function applyConfigTexts() {
  $$("[data-config]").forEach((el) => {
    const key = el.getAttribute("data-config");
    const value = CONFIG.texts[key];
    if (typeof value === "string") el.textContent = value;
  });
  $$(".art-img").forEach((img, i) => {
    img.src = i === 1 ? CONFIG.images.play : CONFIG.images.kiss;
    img.onerror = () => {
      img.replaceWith(placeholder("♡"));
    };
  });
  const finale = $(".finale-img");
  if (finale) {
    finale.src = CONFIG.images.finale;
    finale.onerror = () => {
      finale.replaceWith(placeholder("😊"));
    };
  }
}

function placeholder(text) {
  const div = document.createElement("div");
  div.className = "art-img";
  div.style.display = "grid";
  div.style.placeItems = "center";
  div.style.fontSize = "64px";
  div.textContent = text;
  return div;
}

function showScreen(name, pushHistory = true) {
  if (pushHistory && invitationState.currentStep !== name) {
    historyStack.push(invitationState.currentStep);
  }
  invitationState.currentStep = name;
  $$(".screen").forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
  updateProgress();
  $("#btnBack").disabled = name === "pin" || historyStack.length === 0;
}

const PROGRESS = { pin: 0, question: 28, saidno: 28, datetime: 55, surprise: 78, finale: 100 };

function updateProgress() {
  const wrap = $("#progressWrap");
  const pct = PROGRESS[invitationState.currentStep] ?? 0;
  wrap.hidden = invitationState.currentStep === "pin";
  $("#progressFill").style.width = pct + "%";
  $("#progressHeart").style.left = pct + "%";
}

function spawnHearts(count = 10) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const layer = $("#heartsLayer");
  const phone = $("#phone").getBoundingClientRect();
  for (let i = 0; i < count; i += 1) {
    const h = document.createElement("span");
    h.className = "heart-float";
    h.textContent = ["♥", "♡", "❤"][i % 3];
    h.style.left = phone.left + Math.random() * phone.width + "px";
    h.style.top = phone.top + phone.height * (0.35 + Math.random() * 0.4) + "px";
    h.style.fontSize = 14 + Math.random() * 18 + "px";
    layer.appendChild(h);
    setTimeout(() => h.remove(), 1700);
  }
}

/* PIN */
function renderDigits() {
  const code = invitationState.birthCode;
  $$(".digit").forEach((el, i) => {
    el.textContent = code[i] || "";
  });
}

function pressKey(key) {
  if (invitationState.currentStep !== "pin") return;
  $("#pinError").hidden = true;
  if (key === "back") {
    invitationState.birthCode = invitationState.birthCode.slice(0, -1);
    renderDigits();
    return;
  }
  if (invitationState.birthCode.length >= 4) return;
  invitationState.birthCode += key;
  renderDigits();
  if (invitationState.birthCode.length === 4) {
    setTimeout(validatePin, 180);
  }
}

function validatePin() {
  if (invitationState.birthCode === String(CONFIG.birthCode)) {
    spawnHearts(6);
    showScreen("question");
  } else {
    $("#pinError").hidden = false;
    $("#pinError").textContent = CONFIG.texts.pinWrong;
    $("#digits").classList.remove("shake");
    void $("#digits").offsetWidth;
    $("#digits").classList.add("shake");
    invitationState.birthCode = "";
    renderDigits();
  }
}

$("#keypad").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-key]");
  if (!btn) return;
  pressKey(btn.dataset.key);
});

document.addEventListener("keydown", (e) => {
  if (invitationState.currentStep !== "pin") return;
  if (/^[0-9]$/.test(e.key)) pressKey(e.key);
  if (e.key === "Backspace") pressKey("back");
});

/* Question */
$("#btnYes").addEventListener("click", () => {
  invitationState.accepted = true;
  $("#btnYes").classList.add("bounce");
  spawnHearts(12);
  setTimeout(() => showScreen("datetime"), 280);
});

$("#btnNo").addEventListener("click", (e) => {
  noAttempts += 1;
  const btn = $("#btnNo");
  const dx = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 50);
  const dy = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40);
  btn.style.transform = `translate(${dx}px, ${dy}px)`;
  if (noAttempts >= 3) {
    $("#noHint").hidden = false;
    $("#noHint").textContent = CONFIG.texts.noHint;
  }
  if (noAttempts >= 5) {
    btn.style.transform = "";
    showScreen("saidno");
  }
  e.preventDefault();
});

$("#btnAgree").addEventListener("click", () => {
  invitationState.accepted = true;
  spawnHearts(10);
  showScreen("datetime");
});

/* Date / time */
function syncDateTimeFields() {
  $("#dateValue").textContent = formatDot(invitationState.date);
  $("#timeValue").textContent = invitationState.time;
}

function openCalendar() {
  calendarDraft = invitationState.date;
  calendarCursor = parseISO(invitationState.date);
  renderCalendar();
  $("#calendarOverlay").hidden = false;
}

function renderCalendar() {
  const y = calendarCursor.getFullYear();
  const m = calendarCursor.getMonth();
  $("#calTitle").textContent = `${MONTH_TITLES[m]} ${y}`;
  const weekdays = $("#calWeekdays");
  weekdays.innerHTML = WEEKDAYS.map((w) => `<span>${w}</span>`).join("");
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    let day;
    let iso;
    let outside = false;
    if (i < start) {
      day = prevDays - start + i + 1;
      iso = toISO(new Date(y, m - 1, day));
      outside = true;
    } else if (i >= start + daysInMonth) {
      day = i - start - daysInMonth + 1;
      iso = toISO(new Date(y, m + 1, day));
      outside = true;
    } else {
      day = i - start + 1;
      iso = toISO(new Date(y, m, day));
    }
    const selected = iso === calendarDraft;
    cells.push(
      `<button type="button" class="cal-day${selected ? " is-selected" : ""}${outside ? " is-outside" : ""}" data-iso="${iso}">${day}</button>`
    );
  }
  $("#calGrid").innerHTML = cells.join("");
}

$("#calGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-iso]");
  if (!btn) return;
  calendarDraft = btn.dataset.iso;
  calendarCursor = parseISO(calendarDraft);
  renderCalendar();
});

$("#calPrev").addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
  renderCalendar();
});

$("#calNext").addEventListener("click", () => {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
  renderCalendar();
});

$("#calConfirm").addEventListener("click", () => {
  invitationState.date = calendarDraft;
  syncDateTimeFields();
  $("#calendarOverlay").hidden = true;
});

$("#calReset").addEventListener("click", () => {
  calendarDraft = CONFIG.defaultDate;
  calendarCursor = parseISO(CONFIG.defaultDate);
  renderCalendar();
});

$("#openCalendar").addEventListener("click", openCalendar);

function renderTimeWheels() {
  const [h, mi] = (invitationState.time || CONFIG.defaultTime).split(":");
  const hours = $("#hourWheel");
  const minutes = $("#minuteWheel");
  hours.innerHTML = "";
  minutes.innerHTML = "";
  for (let i = 0; i < 24; i += 1) {
    const v = String(i).padStart(2, "0");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = v;
    b.dataset.val = v;
    if (v === h) b.classList.add("is-selected");
    hours.appendChild(b);
  }
  for (let i = 0; i < 60; i += 1) {
    const v = String(i).padStart(2, "0");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = v;
    b.dataset.val = v;
    if (v === mi) b.classList.add("is-selected");
    minutes.appendChild(b);
  }
  const selH = hours.querySelector(".is-selected");
  const selM = minutes.querySelector(".is-selected");
  if (selH) selH.scrollIntoView({ block: "center" });
  if (selM) selM.scrollIntoView({ block: "center" });
}

function selectedTime() {
  const h = $("#hourWheel").querySelector(".is-selected")?.dataset.val || "19";
  const m = $("#minuteWheel").querySelector(".is-selected")?.dataset.val || "30";
  return `${h}:${m}`;
}

function bindWheel(el) {
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    el.querySelectorAll("button").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    btn.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

bindWheel($("#hourWheel"));
bindWheel($("#minuteWheel"));

$("#openTime").addEventListener("click", () => {
  renderTimeWheels();
  $("#timeOverlay").hidden = false;
});

$("#timeConfirm").addEventListener("click", () => {
  invitationState.time = selectedTime();
  syncDateTimeFields();
  $("#timeOverlay").hidden = true;
});

$("#timeCancel").addEventListener("click", () => {
  invitationState.time = CONFIG.defaultTime;
  renderTimeWheels();
  syncDateTimeFields();
});

$("#calendarOverlay").addEventListener("click", (e) => {
  if (e.target === $("#calendarOverlay")) $("#calendarOverlay").hidden = true;
});
$("#timeOverlay").addEventListener("click", (e) => {
  if (e.target === $("#timeOverlay")) $("#timeOverlay").hidden = true;
});

$("#btnCantWait").addEventListener("click", () => {
  if (!invitationState.date || !invitationState.time) {
    $("#btnCantWait").textContent = CONFIG.texts.needDateTime;
    setTimeout(() => {
      $("#btnCantWait").textContent = CONFIG.texts.cantWaitBtn;
    }, 1400);
    return;
  }
  spawnHearts(8);
  showScreen("surprise");
});

/* Surprise */
function renderSurprises() {
  const grid = $("#surpriseGrid");
  grid.innerHTML = CONFIG.surprises
    .map(
      (s) =>
        `<button type="button" class="surprise-card${invitationState.surprise === s.id ? " is-selected" : ""}" data-id="${s.id}">
          <span class="emo">${s.emoji}</span>
          <span>${s.label}</span>
        </button>`
    )
    .join("");
}

$("#surpriseGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-id]");
  if (!btn) return;
  invitationState.surprise = btn.dataset.id;
  renderSurprises();
  $("#btnSurpriseNext").disabled = false;
});

$("#btnSurpriseNext").addEventListener("click", () => {
  if (!invitationState.surprise) return;
  renderFinale();
  showScreen("finale");
  spawnHearts(14);
});

function renderFinale() {
  $("#finaleTitle").textContent = CONFIG.texts.finaleTitle;
  $("#finaleBody").textContent = CONFIG.texts.finaleBody;
  $("#finaleReady").textContent = CONFIG.texts.finaleReady
    .replace("{date}", formatLong(invitationState.date))
    .replace("{time}", invitationState.time);
}

/* Nav */
$("#btnBack").addEventListener("click", () => {
  const prev = historyStack.pop();
  if (!prev) return;
  showScreen(prev, false);
});

$("#btnReset").addEventListener("click", resetInvitation);

$("#btnEdit").addEventListener("click", () => {
  if (["datetime", "surprise", "finale", "saidno"].includes(invitationState.currentStep)) {
    showScreen("datetime");
    return;
  }
  if (invitationState.currentStep === "question") {
    showScreen("pin");
    return;
  }
  openCalendar();
});

function resetInvitation() {
  invitationState.birthCode = "";
  invitationState.accepted = false;
  invitationState.date = CONFIG.defaultDate;
  invitationState.time = CONFIG.defaultTime;
  invitationState.surprise = null;
  invitationState.currentStep = "pin";
  historyStack.length = 0;
  noAttempts = 0;
  $("#btnNo").style.transform = "";
  $("#noHint").hidden = true;
  $("#btnSurpriseNext").disabled = true;
  $("#pinError").hidden = true;
  renderDigits();
  syncDateTimeFields();
  renderSurprises();
  showScreen("pin", false);
}

/* Music */
function setupMusic() {
  const audio = $("#bgMusic");
  audio.src = CONFIG.musicSrc;
  audio.addEventListener("canplay", () => {
    musicReady = true;
  });
  audio.addEventListener("error", () => {
    musicReady = false;
  });
}

$("#btnMusic").addEventListener("click", async () => {
  const audio = $("#bgMusic");
  if (!musicOn) {
    try {
      await audio.play();
      musicOn = true;
      $("#btnMusic").textContent = "🔊";
    } catch {
      musicOn = false;
      $("#btnMusic").textContent = "🔇";
    }
  } else {
    audio.pause();
    musicOn = false;
    $("#btnMusic").textContent = "🔇";
  }
});

document.body.addEventListener(
  "pointerdown",
  () => {
    if (musicOn) return;
  },
  { once: true }
);

function init() {
  applyConfigTexts();
  renderDigits();
  syncDateTimeFields();
  renderSurprises();
  setupMusic();
  showScreen("pin", false);
}

init();
