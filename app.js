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

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

function makeTexture({ title, subtitle = "", number = "", tone = "aqua", wide = false, panel = false }) {
  const canvas = document.createElement("canvas");
  canvas.id = `ar-texture-${textureSerial++}`;
  canvas.width = wide ? 1200 : 920; canvas.height = panel ? 500 : 250;
  const ctx = canvas.getContext("2d");
  const palettes = { aqua: ["#087f8b", "#20c7d2", "#ffffff"], dark: ["#20232e", "#343948", "#ffffff"], light: ["#f7ffff", "#ffffff", "#20232e"], coral: ["#e56656", "#ff907e", "#ffffff"] };
  const [from, to, ink] = palettes[tone];
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height); g.addColorStop(0, from); g.addColorStop(1, to);
  ctx.shadowColor = "rgba(0,0,0,.34)"; ctx.shadowBlur = 28; ctx.shadowOffsetY = 14; ctx.fillStyle = g;
  roundedRect(ctx, 30, 24, canvas.width - 60, canvas.height - 62, panel ? 50 : 94);
  ctx.shadowColor = "transparent"; ctx.strokeStyle = tone === "light" ? "#bce9e9" : "rgba(255,255,255,.38)"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(44, 38, canvas.width - 88, canvas.height - 90, panel ? 38 : 70); ctx.stroke();
  let left = 78;
  if (number) {
    ctx.fillStyle = tone === "light" ? "#d9f5f4" : "rgba(255,255,255,.2)"; ctx.beginPath(); ctx.arc(112, canvas.height / 2 - 9, 48, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink; ctx.font = "800 45px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(number, 112, canvas.height / 2 - 7); left = 185;
  }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = ink;
  const titleSize = panel ? 52 : (title.length > 22 ? 38 : 48); ctx.font = `800 ${titleSize}px Arial`;
  const titleY = subtitle ? (panel ? 132 : 107) : canvas.height / 2 + 8; wrapText(ctx, title, left, titleY, canvas.width - left - 65, panel ? 60 : 48, panel ? 2 : 1);
  if (subtitle) { ctx.globalAlpha = .78; ctx.font = `${panel ? 32 : 29}px Arial`; wrapText(ctx, subtitle, left, titleY + (panel ? 124 : 50), canvas.width - left - 80, panel ? 45 : 37, panel ? 4 : 2); ctx.globalAlpha = 1; }
  textureBin.append(canvas); return `#${canvas.id}`;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" "); let line = ""; let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = `${line}${words[i]} `;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line.trim(), x, y); line = `${words[i]} `; y += lineHeight; lines++; if (lines >= maxLines - 1) { line += words.slice(i + 1).join(" "); break; } }
    else line = test;
  }
  if (line) { let out = line.trim(); while (ctx.measureText(out).width > maxWidth && out.length > 4) out = `${out.slice(0,-2)}…`; ctx.fillText(out, x, y); }
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

async function startScanner() {
  showScreen("scanner"); scanHint.hidden = false; tapTip.hidden = true; scanStatus.textContent = "Запускаем камеру…";
  try { if (!scene.hasLoaded) await new Promise(resolve => scene.addEventListener("loaded", resolve, { once: true })); await scene.systems["mindar-image-system"].start(); arStarted = true; scanStatus.textContent = "Выдохи в воду"; }
  catch (error) { console.error(error); scanStatus.textContent = "Камера недоступна"; scanHint.textContent = location.protocol === "https:" ? "Разрешите доступ к камере в настройках браузера" : "Для камеры откройте защищённую HTTPS-ссылку"; }
}

function stopScanner() { if (arStarted) { scene.systems["mindar-image-system"].stop(); arStarted = false; } }
function openContent() { stopScanner(); showScreen("content"); }
target.addEventListener("targetFound", () => { clearTimeout(lostTimer); scanHint.hidden = true; tapTip.hidden = false; scanStatus.textContent = "Карточка распознана"; arInterface.setAttribute("visible", true); renderAR(view); navigator.vibrate?.(60); });
target.addEventListener("targetLost", () => { scanStatus.textContent = "Верните карточку в кадр"; tapTip.hidden = true; lostTimer = setTimeout(() => { scanHint.hidden = false; arInterface.setAttribute("visible", false); }, 700); });
document.querySelector("#start-scan").addEventListener("click", startScanner);
document.querySelector("#demo-mode").addEventListener("click", openContent);
document.querySelector("#cancel-scan").addEventListener("click", () => { stopScanner(); showScreen("welcome"); });
document.querySelector("#back-home").addEventListener("click", () => showScreen("welcome"));
document.querySelector("#rescan").addEventListener("click", startScanner);
renderStages(); renderAR("hub");
