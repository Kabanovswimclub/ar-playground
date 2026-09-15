const stages = [
  { title: "Подуть ртом", hint: "Первое знакомство с направленным выдохом", exercises: ["Дуем на предмет, отгоняя его от себя без рук.", "Гудим как самолёт, произнося «уууу».", "Делаем ямку на воде направленным выдохом.", "Задуваем воображаемую свечу над водой."] },
  { title: "Задержать дыхание", hint: "Не опуская лицо в воду", exercises: ["Пробуем с зажатым носом и без него.", "Не дышим короткое комфортное время.", "Успеваем собрать башню или убрать игрушки."] },
  { title: "Пузыри ртом", hint: "Выдох в воду через трубочку", exercises: ["Готовим пузырьковый коктейль в стаканчике.", "Дуем через трубочку и «варим» игрушку.", "Делаем семью пузырей разного размера и звука."] },
  { title: "Опустить лицо под воду", hint: "Сначала зажимаем нос рукой", exercises: ["Проверяем: рот закрыт, очки надеты, нос зажат.", "Рассматриваем игрушку под водой.", "Играем под водой в «Угадай что».", "Считаем показанные под водой пальцы."] },
  { title: "Высморкнуться носом", hint: "Подготовка к выдоху носом", exercises: ["Высмаркиваемся со звуком «хуммм».", "Мягко закрываем одну ноздрю и повторяем."] },
  { title: "Лицо под воду без рук", hint: "Погружение на задержке дыхания", exercises: ["Сначала делаем несколько выдохов носом.", "Повторяем под водой игру «Угадай что».", "Считаем пальцы после погружения."] },
  { title: "Выдох носом в воду", hint: "Контрольный навык", exercises: ["Делаем семью из пяти пузырей.", "Соревнуемся, у кого пузыри громче.", "Соревнуемся, у кого выдох дольше."] }
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
let view = "levels";
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

function renderLevels() {
  addPlane({ title: "7 СТУПЕНЕЙ ОБУЧЕНИЯ", tone: "dark", position: [-.08,.52,.07], width: .92, height: .12 });
  addPlane({ title: "?", tone: "light", position: [.48,.52,.12], width: .15, height: .12, action: "help", delay: 80 });
  const ys = [.38,.25,.12,-.01,-.14,-.27,-.40];
  stages.forEach((stage, index) => addPlane({ title: stage.title, number: String(index + 1), tone: "aqua", position: [0,ys[index],.09 + index * .006], width: .98, height: .118, action: `level:${index}`, delay: 90 + index * 60 }));
}

function renderExercises() {
  const stage = stages[currentLevel];
  addPlane({ title: `${currentLevel + 1}. ${stage.title}`, subtitle: stage.hint, tone: "dark", position: [0,.44,.07], width: .9, height: .19 });
  const count = stage.exercises.length;
  const gap = count === 4 ? .19 : .22;
  const startY = count === 4 ? .23 : .19;
  stage.exercises.forEach((exercise, index) => addPlane({ title: `Упражнение ${index + 1}`, subtitle: exercise, number: String(index + 1), tone: "light", position: [0,startY - index * gap,.09 + index * .01], width: 1.08, height: count === 4 ? .17 : .19, delay: 90 + index * 90 }));
  addPlane({ title: "‹ Назад к ступеням", tone: "aqua", position: [0,-.42,.14], width: .64, height: .12, action: "levels", delay: 430 });
}

function renderInfo(kind) {
  addPlane({ title: "КАК ПОЛЬЗОВАТЬСЯ", subtitle: "Короткая инструкция", tone: "dark", position: [0,.40,.08], width: .94, height: .19 });
  addPlane({ title: "Выберите ступень", subtitle: "Нажмите на её большую голубую кнопку. Вместо ступеней появится список упражнений. Чтобы вернуться, нажмите «Назад к ступеням».", tone: "light", position: [0,.04,.11], width: 1.08, height: .43, panel: true, delay: 100 });
  addPlane({ title: "‹ Назад к ступеням", tone: "aqua", position: [0,-.30,.13], width: .64, height: .12, action: "levels", delay: 260 }); addBubbles();
}

function renderAR(nextView = view) {
  view = nextView; arInterface.innerHTML = ""; textureBin.innerHTML = "";
  if (view === "levels") renderLevels(); else if (view === "exercises") renderExercises(); else renderInfo(view);
}

function handleAction(action) {
  navigator.vibrate?.(30);
  if (["levels","help"].includes(action)) renderAR(action);
  else if (action.startsWith("level:")) { currentLevel = Number(action.split(":")[1]); renderAR("exercises"); }
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
renderStages(); renderAR("levels");
