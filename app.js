const stages = [
  { title: "Подуть ртом", hint: "Первое знакомство с направленным выдохом", exercises: ["Дуем на предмет, отгоняя его от себя без рук.", "Гудим как самолёт, произнося «уууу».", "Делаем ямку на воде направленным выдохом.", "Задуваем воображаемую свечу над водой."] },
  { title: "Задержать дыхание", hint: "Не опуская лицо в воду", exercises: ["Пробуем с зажатым носом и без него.", "Не дышим короткое комфортное время.", "Успеваем собрать башню или убрать игрушки."] },
  { title: "Пузыри ртом", hint: "Выдох в воду через трубочку", exercises: ["Готовим пузырьковый коктейль в стаканчике.", "Дуем через трубочку и «варим» игрушку.", "Делаем семью пузырей разного размера и звука."] },
  { title: "Лицо под воду", hint: "Сначала зажимаем нос рукой", exercises: ["Проверяем: рот закрыт, очки надеты, нос зажат.", "Рассматриваем игрушку под водой.", "Играем под водой в «Угадай что».", "Считаем показанные под водой пальцы."] },
  { title: "Выдох носом", hint: "Подготовка на суше", exercises: ["Высмаркиваемся со звуком «хуммм».", "Мягко закрываем одну ноздрю и повторяем."] },
  { title: "Лицо без рук", hint: "Погружение на задержке дыхания", exercises: ["Сначала делаем несколько выдохов носом.", "Повторяем под водой игру «Угадай что».", "Считаем пальцы после погружения."] },
  { title: "Пузыри носом", hint: "Контрольный навык", exercises: ["Делаем семью из пяти пузырей.", "Соревнуемся, у кого пузыри громче.", "Соревнуемся, у кого выдох дольше."] }
];

const screens = { welcome: document.querySelector("#welcome"), scanner: document.querySelector("#scanner"), content: document.querySelector("#content") };
const scene = document.querySelector("#ar-scene");
const target = document.querySelector("#target");
const arInterface = document.querySelector("#ar-interface");
const scanHint = document.querySelector("#scan-hint");
const scanStatus = document.querySelector("#scan-status");
const tapTip = document.querySelector("#tap-tip");
const trackedUi = document.querySelector("#tracked-ui");
const trackedLevels = document.querySelector("#tracked-levels");
const trackedExercises = document.querySelector("#tracked-exercises");
const trackedInstructions = document.querySelector("#tracked-instructions");
let arStarted = false;
let currentLevel = 2;
let currentExercise = 0;
let view = "hub";
let textureSerial = 0;
let lostTimer;

const textureBin = document.createElement("div");
textureBin.hidden = true;
document.body.append(textureBin);

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function makeTexture({ title, subtitle = "", number = "", tone = "aqua", wide = false, panel = false }) {
  const id = `ar-texture-${textureSerial++}`;
  const width = wide ? 1200 : 920;
  const height = panel ? 500 : 250;
  const palettes = { aqua: ["#087f8b", "#20c7d2", "#ffffff"], dark: ["#20232e", "#343948", "#ffffff"], light: ["#f7ffff", "#ffffff", "#20232e"], coral: ["#e56656", "#ff907e", "#ffffff"] };
  const [from, to, ink] = palettes[tone];
  const left = number ? 185 : 78;
  const titleSize = panel ? 52 : (title.length > 22 ? 38 : 48);
  const titleY = subtitle ? (panel ? 132 : 107) : height / 2 + 8;
  const titleLines = splitLines(title, panel ? 32 : 28, panel ? 2 : 1);
  const subLines = splitLines(subtitle, panel ? 52 : 45, panel ? 4 : 2);
  const titleSvg = titleLines.map((line, i) => `<tspan x="${left}" y="${titleY + i * (panel ? 60 : 48)}">${escapeXml(line)}</tspan>`).join("");
  const subStart = titleY + (panel ? 124 : 50);
  const subtitleSvg = subLines.map((line, i) => `<tspan x="${left}" y="${subStart + i * (panel ? 45 : 37)}">${escapeXml(line)}</tspan>`).join("");
  const numberSvg = number ? `<circle cx="112" cy="${height / 2 - 9}" r="48" fill="${tone === "light" ? "#d9f5f4" : "#ffffff"}" fill-opacity="${tone === "light" ? "1" : ".2"}"/><text x="112" y="${height / 2 + 7}" text-anchor="middle" font-family="Arial,sans-serif" font-size="45" font-weight="800" fill="${ink}">${escapeXml(number)}</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><filter id="s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-opacity=".34"/></filter></defs><rect x="30" y="24" width="${width - 60}" height="${height - 62}" rx="${panel ? 50 : 94}" fill="url(#g)" filter="url(#s)"/><rect x="44" y="38" width="${width - 88}" height="${height - 90}" rx="${panel ? 38 : 70}" fill="none" stroke="${tone === "light" ? "#bce9e9" : "#ffffff"}" stroke-opacity="${tone === "light" ? "1" : ".38"}" stroke-width="5"/>${numberSvg}<text font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="800" fill="${ink}">${titleSvg}</text>${subtitle ? `<text font-family="Arial,sans-serif" font-size="${panel ? 32 : 29}" fill="${ink}" fill-opacity=".78">${subtitleSvg}</text>` : ""}</svg>`;
  const image = document.createElement("img");
  image.id = id;
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  textureBin.append(image);
  return `#${id}`;
}

function splitLines(text, maxChars, maxLines) {
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach(word => {
    if (`${line} ${word}`.trim().length > maxChars && line && lines.length < maxLines - 1) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  });
  if (line) lines.push(line.length > maxChars + 8 ? `${line.slice(0, maxChars + 5)}…` : line);
  return lines.slice(0, maxLines);
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
}

function entity(tag, attrs = {}) {
  const node = document.createElement(tag); Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value)); return node;
}

function addPlane({ title, subtitle, number, tone = "aqua", position, width = .58, height = .16, action, delay = 0, panel = false }) {
  const plane = entity("a-plane", { position: `${position[0]} ${position[1]} ${position[2] || .08}`, width, height, material: `src: ${makeTexture({ title, subtitle, number, tone, wide: width > .7, panel })}; transparent: true; shader: flat; alphaTest: 0.02`, scale: "0.001 0.001 0.001", animation__in: `property: scale; to: 1 1 1; dur: 420; delay: ${delay}; easing: easeOutBack` });
  if (action) {
    plane.classList.add("clickable"); plane.dataset.action = action;
    plane.addEventListener("mouseenter", () => plane.setAttribute("scale", "1.06 1.06 1.06"));
    plane.addEventListener("mouseleave", () => plane.setAttribute("scale", "1 1 1"));
    plane.addEventListener("click", () => handleAction(action));
  }
  arInterface.append(plane); return plane;
}

function addBubbles() {
  [[-.14,-.18,.024,0],[.13,-.23,.018,500],[.04,-.24,.014,900]].forEach(([x,y,r,delay]) => arInterface.append(entity("a-ring", { position: `${x} ${y} .07`, "radius-inner": r * .72, "radius-outer": r, color: "#bff8f5", opacity: ".9", animation__float: `property: position; from: ${x} ${y} .07; to: ${x} .30 .07; dur: 1900; delay: ${delay}; loop: true; easing: easeInOutSine`, animation__fade: `property: opacity; from: .9; to: .12; dur: 1900; delay: ${delay}; loop: true` })));
}

function renderHub() {
  addPlane({ title: "ВЫДОХИ В ВОДУ", subtitle: "Интерактивная карта навыка", tone: "dark", position: [0,.43,.07], width: .86, height: .19 });
  addPlane({ title: "7 уровней", subtitle: "Путь обучения", number: "01", position: [-.55,.19,.09], action: "levels", delay: 100 });
  addPlane({ title: "Упражнения", subtitle: "Для занятия", number: "02", position: [.55,.04,.1], action: "exercises", delay: 190 });
  addPlane({ title: "Типичные ошибки", subtitle: "Что исправить", number: "03", tone: "coral", position: [-.55,-.13,.11], action: "mistakes", delay: 280 });
  addPlane({ title: "Как заниматься", subtitle: "Подсказка родителю", number: "04", tone: "light", position: [.55,-.29,.12], action: "how", delay: 370 });
  addBubbles();
}

function renderLevels() {
  addPlane({ title: "ВЫБЕРИТЕ УРОВЕНЬ", subtitle: "Нажмите на один из этапов", tone: "dark", position: [0,.45,.07], width: .84, height: .18 });
  const ys = [.26,.09,-.08,-.25];
  stages.forEach((stage, index) => { const side = index % 2 === 0 ? -1 : 1; const row = Math.floor(index / 2); addPlane({ title: stage.title, number: String(index + 1), tone: index === currentLevel ? "aqua" : "light", position: [side * .55, ys[row], .09 + index * .004], width: .55, height: .145, action: `level:${index}`, delay: 65 + index * 55 }); });
  addPlane({ title: "‹ Назад", tone: "dark", position: [.42,-.42,.1], width: .32, height: .11, action: "hub", delay: 420 });
}

function renderExercises() {
  const stage = stages[currentLevel];
  addPlane({ title: `${currentLevel + 1}. ${stage.title}`, subtitle: stage.hint, tone: "dark", position: [0,.44,.07], width: .9, height: .19 });
  const positions = [[-.54,.22],[.54,.07],[-.54,-.10],[.54,-.25]];
  stage.exercises.slice(0,4).forEach((exercise, index) => addPlane({ title: `Упражнение ${index + 1}`, subtitle: exercise, number: String(index + 1), tone: index % 2 ? "light" : "aqua", position: [...positions[index],.09 + index * .01], width: .62, height: .19, action: `exercise:${index}`, delay: 90 + index * 90 }));
  addPlane({ title: "‹ Уровни", tone: "dark", position: [-.21,-.43,.12], width: .34, height: .105, action: "levels", delay: 430 });
  addPlane({ title: "Следующий ›", tone: "aqua", position: [.22,-.43,.12], width: .38, height: .105, action: "next", delay: 480 });
}

function renderDetail() {
  const stage = stages[currentLevel];
  addPlane({ title: `УПРАЖНЕНИЕ ${currentExercise + 1}`, subtitle: `${currentLevel + 1}-й уровень · ${stage.title}`, tone: "dark", position: [0,.43,.08], width: .86, height: .18 });
  addPlane({ title: stage.exercises[currentExercise], subtitle: "Выполняйте спокойно, в игровой форме. Остановитесь, если ребёнку некомфортно.", tone: "light", position: [0,.08,.11], width: 1.05, height: .42, panel: true, delay: 100 });
  addPlane({ title: "‹ К списку", tone: "dark", position: [-.24,-.30,.13], width: .4, height: .12, action: "exercises", delay: 250 });
  addPlane({ title: "Следующее ›", tone: "aqua", position: [.24,-.30,.13], width: .42, height: .12, action: "nextExercise", delay: 310 }); addBubbles();
}

function renderInfo(kind) {
  const mistake = "Ребёнок задерживает воздух с напряжением, торопится или боится воды у лица.";
  const how = "Выберите один уровень и 1–2 упражнения. Повторяйте коротко, через игру и без принуждения.";
  addPlane({ title: kind === "mistakes" ? "ТИПИЧНЫЕ ОШИБКИ" : "КАК ЗАНИМАТЬСЯ", subtitle: kind === "mistakes" ? "Подсказка инструктору и родителю" : "Простой сценарий занятия", tone: kind === "mistakes" ? "coral" : "dark", position: [0,.42,.08], width: .94, height: .19 });
  addPlane({ title: kind === "mistakes" ? mistake : how, subtitle: kind === "mistakes" ? "Вернитесь на предыдущий уверенный уровень и снова превратите задачу в игру." : "Заканчивайте на успешной попытке. Следующий уровень открывайте, когда предыдущий даётся уверенно.", tone: "light", position: [0,.05,.11], width: 1.05, height: .43, panel: true, delay: 100 });
  addPlane({ title: "‹ Главное меню", tone: "aqua", position: [0,-.30,.13], width: .52, height: .12, action: "hub", delay: 260 }); addBubbles();
}

function renderAR(nextView = view) {
  view = nextView; arInterface.innerHTML = ""; textureBin.innerHTML = "";
  if (view === "hub") renderHub(); else if (view === "levels") renderLevels(); else if (view === "exercises") renderExercises(); else if (view === "detail") renderDetail(); else renderInfo(view);
}

function handleAction(action) {
  navigator.vibrate?.(30);
  if (["hub","levels","exercises","mistakes","how"].includes(action)) renderAR(action);
  else if (action === "next") { currentLevel = (currentLevel + 1) % stages.length; renderAR("exercises"); }
  else if (action === "nextExercise") { currentExercise = (currentExercise + 1) % stages[currentLevel].exercises.length; renderAR("detail"); }
  else if (action.startsWith("level:")) { currentLevel = Number(action.split(":")[1]); currentExercise = 0; renderAR("exercises"); }
  else if (action.startsWith("exercise:")) { currentExercise = Number(action.split(":")[1]); renderAR("detail"); }
}

function renderStages() {
  const holder = document.querySelector("#stages");
  holder.innerHTML = stages.map((stage, index) => `<article class="stage"><button class="stage-toggle" aria-expanded="${index === 0}" aria-controls="stage-${index}"><span class="stage-number">${String(index + 1).padStart(2,"0")}</span><span class="stage-copy"><strong>${stage.title}</strong><small>${stage.hint}</small></span><span class="chevron">⌄</span></button><div class="stage-body" id="stage-${index}" ${index === 0 ? "" : "hidden"}><ol>${stage.exercises.map(item => `<li>${item}</li>`).join("")}</ol></div></article>`).join("");
  holder.addEventListener("click", event => { const button = event.target.closest(".stage-toggle"); if (!button) return; const body = document.querySelector(`#${button.getAttribute("aria-controls")}`); const open = button.getAttribute("aria-expanded") !== "true"; button.setAttribute("aria-expanded", String(open)); body.hidden = !open; });
}

function showTrackedPanel(name) {
  trackedLevels.hidden = name !== "levels";
  trackedExercises.hidden = name !== "exercises";
  trackedInstructions.hidden = name !== "instructions";
}

function renderTrackedControls() {
  document.querySelector("#tracked-level-buttons").innerHTML = stages.map((stage, index) => `<button class="tracked-level-button" data-tracked-level="${index}"><b>${index + 1}</b><span>${stage.title}</span></button>`).join("");
  document.querySelector("#tracked-level-buttons").addEventListener("click", event => {
    const button = event.target.closest("[data-tracked-level]");
    if (!button) return;
    const index = Number(button.dataset.trackedLevel);
    const stage = stages[index];
    document.querySelector("#tracked-kicker").textContent = `СТУПЕНЬ ${index + 1} ИЗ ${stages.length}`;
    document.querySelector("#tracked-stage-title").textContent = stage.title;
    document.querySelector("#tracked-stage-hint").textContent = stage.hint;
    document.querySelector("#tracked-exercise-list").innerHTML = stage.exercises.map(exercise => `<li>${exercise}</li>`).join("");
    showTrackedPanel("exercises");
    navigator.vibrate?.(30);
  });
  document.querySelector("#tracked-back").addEventListener("click", () => showTrackedPanel("levels"));
  document.querySelector("#tracked-help").addEventListener("click", () => showTrackedPanel("instructions"));
  document.querySelector("#tracked-help-back").addEventListener("click", () => showTrackedPanel("levels"));
}

async function startScanner() {
  showScreen("scanner"); scanHint.hidden = false; tapTip.hidden = true; trackedUi.hidden = true; showTrackedPanel("levels"); scanStatus.textContent = "Запускаем камеру…";
  try { if (!scene.hasLoaded) await new Promise(resolve => scene.addEventListener("loaded", resolve, { once: true })); await scene.systems["mindar-image-system"].start(); arStarted = true; scanStatus.textContent = "Выдохи в воду"; }
  catch (error) { console.error(error); scanStatus.textContent = "Камера недоступна"; scanHint.textContent = location.protocol === "https:" ? "Разрешите доступ к камере в настройках браузера" : "Для камеры откройте защищённую HTTPS-ссылку"; }
}

function stopScanner() { if (arStarted) { scene.systems["mindar-image-system"].stop(); arStarted = false; } }
function openContent() { stopScanner(); showScreen("content"); }
target.addEventListener("targetFound", () => { clearTimeout(lostTimer); scanHint.hidden = true; tapTip.hidden = true; trackedUi.hidden = false; showTrackedPanel("levels"); scanStatus.textContent = "Карточка распознана"; arInterface.setAttribute("visible", true); renderAR(view); navigator.vibrate?.(60); });
target.addEventListener("targetLost", () => { scanStatus.textContent = "Верните карточку в кадр"; tapTip.hidden = true; lostTimer = setTimeout(() => { scanHint.hidden = false; trackedUi.hidden = true; arInterface.setAttribute("visible", false); }, 1200); });
document.querySelector("#start-scan").addEventListener("click", startScanner);
document.querySelector("#demo-mode").addEventListener("click", openContent);
document.querySelector("#cancel-scan").addEventListener("click", () => { stopScanner(); showScreen("welcome"); });
document.querySelector("#back-home").addEventListener("click", () => showScreen("welcome"));
document.querySelector("#rescan").addEventListener("click", startScanner);
renderStages(); renderTrackedControls(); renderAR("hub");
