const stages = [
  {
    title: "Подуть ртом",
    hint: "Первое знакомство с направленным выдохом",
    exercises: [
      "Дуем на предмет, отгоняя его от себя без рук.",
      "Гудим как самолёт, произнося «уууу».",
      "Делаем ямку на воде: дуем так, чтобы на поверхности появилась ямка.",
      "Задуваем свечу: достаём предмет из воды и прячем его под воду, как только ребёнок подует."
    ]
  },
  {
    title: "Задержать дыхание",
    hint: "Не опуская лицо в воду",
    exercises: [
      "Пробуем с зажатым носом и без него.",
      "Предлагаем не дышать определённое время. Начинаем чуть меньше, чем ребёнок уже может, чтобы он почувствовал успех.",
      "Предлагаем что-нибудь успеть, пока не дышим: собрать башню или убрать игрушки в корзину."
    ]
  },
  {
    title: "Пузыри ртом",
    hint: "Выдох в воду через трубочку",
    exercises: [
      "Делаем пузыри в стаканчик и выливаем их на голову взрослому — готовим «пузырьковый коктейль».",
      "Дуем через трубочку и «варим» игрушку. Проверяем аромат и решаем, нужно ли поварить ещё.",
      "Делаем семью пузырей со звуком: маленький пузырёк, сестричка, старший брат, мама и папа. Между пузырями спокойно вдыхаем."
    ]
  },
  {
    title: "Опустить лицо под воду",
    hint: "Зажав нос рукой",
    exercises: [
      "Перед погружением проговариваем: рот закрыт, в ушах вода уже была, глаза защищены очками, нос зажат.",
      "Предлагаем посмотреть на предмет на дне или просто под водой.",
      "Игра «Угадай что»: показываем две игрушки, прячем их за спину и под водой показываем одну.",
      "Показываем под водой пальцы от одного до пяти. После погружения ребёнок называет увиденное число."
    ]
  },
  {
    title: "Высморкнуться носом",
    hint: "Подготовка к выдоху носом",
    exercises: [
      "Обычное высмаркивание со звуком «хуммм» и закрытым ртом.",
      "Подносим руку к носу ребёнка и мягко закрываем одну ноздрю."
    ]
  },
  {
    title: "Лицо под воду без рук",
    hint: "На задержке дыхания",
    exercises: [
      "Перед этим обязательно делаем несколько выдохов носом.",
      "Повторяем игру «Угадай что» с двумя игрушками.",
      "Показываем под водой пальцы от одного до пяти, ребёнок называет число после погружения."
    ]
  },
  {
    title: "Выдох носом в воду",
    hint: "Контрольный навык последовательности",
    exercises: [
      "Делаем семью из пяти пузырей.",
      "Соревнуемся: у кого пузыри громче.",
      "Соревнуемся: у кого выдох и пузыри дольше."
    ]
  }
];

const screens = {
  welcome: document.querySelector("#welcome"),
  scanner: document.querySelector("#scanner"),
  content: document.querySelector("#content")
};
const scene = document.querySelector("#ar-scene");
const target = document.querySelector("#target");
const arDrawer = document.querySelector("#ar-drawer");
const scanHint = document.querySelector("#scan-hint");
const scanStatus = document.querySelector("#scan-status");
let arStarted = false;
let currentLevel = 0;
let pinned = false;
let lostTimer;

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderStages() {
  const holder = document.querySelector("#stages");
  holder.innerHTML = stages.map((stage, index) => `
    <article class="stage">
      <button class="stage-toggle" aria-expanded="${index === 0}" aria-controls="stage-${index}">
        <span class="stage-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="stage-copy"><strong>${stage.title}</strong><small>${stage.hint}</small></span>
        <span class="chevron">⌄</span>
      </button>
      <div class="stage-body" id="stage-${index}" ${index === 0 ? "" : "hidden"}>
        <ol>${stage.exercises.map(item => `<li>${item}</li>`).join("")}</ol>
      </div>
    </article>`).join("");

  holder.addEventListener("click", (event) => {
    const button = event.target.closest(".stage-toggle");
    if (!button) return;
    const body = document.querySelector(`#${button.getAttribute("aria-controls")}`);
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    body.hidden = !willOpen;
  });
}

async function startScanner() {
  showScreen("scanner");
  arDrawer.hidden = true;
  scanHint.hidden = false;
  scanStatus.textContent = "Запускаем камеру…";
  try {
    if (!scene.hasLoaded) await new Promise(resolve => scene.addEventListener("loaded", resolve, { once: true }));
    await scene.systems["mindar-image-system"].start();
    arStarted = true;
    scanStatus.textContent = "Выдохи в воду";
  } catch (error) {
    console.error(error);
    scanStatus.textContent = "Камера недоступна";
    scanHint.textContent = location.protocol === "https:"
      ? "Разрешите доступ к камере в настройках браузера"
      : "Для камеры откройте страницу по защищённой HTTPS-ссылке";
  }
}

function stopScanner() {
  if (arStarted) {
    scene.systems["mindar-image-system"].stop();
    arStarted = false;
  }
}

function openContent() {
  stopScanner();
  showScreen("content");
}

target.addEventListener("targetFound", () => {
  clearTimeout(lostTimer);
  arDrawer.hidden = false;
  scanHint.hidden = true;
  scanStatus.textContent = "Карточка распознана · нажмите уровень";
  selectLevel(currentLevel);
  navigator.vibrate?.(60);
});

target.addEventListener("targetLost", () => {
  scanStatus.textContent = pinned ? "Меню зафиксировано" : "Верните карточку в кадр";
  if (!pinned) lostTimer = setTimeout(() => { arDrawer.hidden = true; scanHint.hidden = false; }, 1200);
});

function selectLevel(index) {
  currentLevel = (index + stages.length) % stages.length;
  const stage = stages[currentLevel];
  document.querySelector("#drawer-kicker").textContent = `УРОВЕНЬ ${currentLevel + 1} ИЗ ${stages.length}`;
  document.querySelector("#drawer-title").textContent = stage.title;
  document.querySelector("#drawer-hint").textContent = stage.hint;
  document.querySelector("#ar-stage-label").setAttribute("value", `${currentLevel + 1} / 7`);
  document.querySelectorAll(".ar-level").forEach((node, i) => node.setAttribute("color", i === currentLevel ? "#50c9cf" : "#ffffff"));
  document.querySelectorAll(".level-chip").forEach((node, i) => {
    node.classList.toggle("active", i === currentLevel);
    node.setAttribute("aria-pressed", String(i === currentLevel));
  });
  document.querySelector("#exercise-menu").hidden = true;
  document.querySelector("#show-exercises").textContent = "Упражнения";
}

function renderArControls() {
  const chips = document.querySelector("#level-chips");
  chips.innerHTML = stages.map((stage, i) => `<button class="level-chip${i === 0 ? " active" : ""}" data-level="${i}" aria-label="${stage.title}">${i + 1}</button>`).join("");
  chips.addEventListener("click", event => {
    const button = event.target.closest(".level-chip");
    if (button) selectLevel(Number(button.dataset.level));
  });
  document.querySelectorAll(".ar-level").forEach(button => button.addEventListener("click", () => selectLevel(Number(button.dataset.level))));
}

document.querySelector("#show-exercises").addEventListener("click", () => {
  const menu = document.querySelector("#exercise-menu");
  const opening = menu.hidden;
  menu.innerHTML = stages[currentLevel].exercises.map((exercise, i) => `
    <button class="exercise-choice"><span>${i + 1}</span><strong>${exercise}</strong></button>`).join("");
  menu.hidden = !opening;
  document.querySelector("#show-exercises").textContent = opening ? "Скрыть" : "Упражнения";
});

document.querySelector("#next-level").addEventListener("click", () => selectLevel(currentLevel + 1));
document.querySelector("#freeze-ar").addEventListener("click", event => {
  pinned = !pinned;
  event.currentTarget.classList.toggle("active", pinned);
  event.currentTarget.setAttribute("aria-pressed", String(pinned));
  scanStatus.textContent = pinned ? "Меню зафиксировано" : "Карточка распознана · нажмите уровень";
});

document.querySelector("#start-scan").addEventListener("click", startScanner);
document.querySelector("#demo-mode").addEventListener("click", openContent);
document.querySelector("#cancel-scan").addEventListener("click", () => { stopScanner(); showScreen("welcome"); });
document.querySelector("#back-home").addEventListener("click", () => showScreen("welcome"));
document.querySelector("#rescan").addEventListener("click", startScanner);

renderStages();
renderArControls();
