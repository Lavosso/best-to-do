import { addCaffeine, createTask, getCaffeine, getTasks, removeCaffeine, setCompleted } from "./api.js";
import { caffeineInBody, caffeineMeter, drinks, playerStats, priorities, xpPerLevel } from "./progress.js";

const $ = (id) => document.getElementById(id);
const form = $("task-form");
const dialog = $("editor");
const filters = document.querySelectorAll("[data-filter]");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const feedbackHint = "Kliknij wypity napój";
const caffeineWarnings = { high: "Wysokie stężenie", "very-high": "Bardzo wysokie stężenie!" };
let tasks = null;
let intake = null;
let lastDrink = null;
let feedbackTimer;
let filter = "all";
let busy = false;

const iconPaths = {
  chart: "M4 19h16 M6 15v-4 M12 15V5 M18 15V8",
  bolt: "m13 2-9 12h7l-1 8 10-13h-8z",
  check: "m5 12 4 4 10-10",
  cup: "M17 8h1a4 4 0 0 1 0 8h-1 M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M6 2v3 M10 2v3 M14 2v3",
  flag: "M5 21V4c5-4 9 4 15 0v10c-6 4-10-4-15 0",
  gem: "m3 9 4-5h10l4 5-9 12z M3 9h18 M9 9l3 12 3-12",
  refresh: "M20 7v5h-5 M4 17v-5h5 M6 8a7 7 0 0 1 12-2l2 4 M4 14l2 4a7 7 0 0 0 12-2",
};
for (const node of document.querySelectorAll("[data-icon]")) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", iconPaths[node.dataset.icon]);
  svg.append(path);
  node.append(svg);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

for (const [value, { label, xp }] of Object.entries(priorities)) {
  form.elements.priorytet.add(new Option(label, value, value === "sredni", value === "sredni"));
  const row = document.createElement("div");
  row.append(element("dt", `priority ${value}`, label), element("dd", "", `+${xp} XP`));
  $("rewards").append(row);
}

for (const [type, { label, xp }] of Object.entries(drinks)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "drink";
  button.dataset.drink = type;
  button.title = `${label} · +${xp} XP`;
  button.setAttribute("aria-label", `Dodaj napój: ${label}, +${xp} XP`);
  button.addEventListener("click", () => drink(type, button));
  $("drinks").append(button);
  const row = document.createElement("div");
  row.append(element("dt", "drink-reward", label), element("dd", "", `+${xp} XP`));
  $("drink-rewards").append(row);
}
$("caffeine-bar").style.setProperty("--segments", caffeineMeter.maxMg / caffeineMeter.stepMg);
$("caffeine-bar").setAttribute("aria-valuemax", caffeineMeter.maxMg);

function renderTask(task) {
  const item = document.createElement("li");
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = task.wykonane;
  toggle.dataset.id = task.id;
  toggle.disabled = busy;
  toggle.setAttribute("aria-label", `Ukończono: ${task.tytul}`);
  toggle.addEventListener("change", () => toggleTask(task));
  item.classList.toggle("completed", task.wykonane);
  const body = element("div", "task-body", "");
  body.append(element("h3", "", task.tytul));
  if (task.opis) body.append(element("p", "", task.opis));
  const meta = element("div", "metadata", "");
  const priority = priorities[task.priorytet];
  meta.append(element("span", `priority ${task.priorytet}`, priority.label));
  if (task.termin) {
    const date = element("time", "", `Termin: ${new Date(task.termin + "T00:00:00").toLocaleDateString("pl-PL")}`);
    date.dateTime = task.termin;
    meta.append(date);
  }
  for (const tag of task.tagi) meta.append(element("span", "", "#" + tag));
  body.append(meta);
  item.append(toggle, body, element("span", "task-xp", `+${priority.xp} XP`));
  return item;
}

function renderCaffeine() {
  if (intake === null) return;
  const { mg, level } = caffeineInBody(intake);
  const warning = caffeineWarnings[level];
  $("caffeine").dataset.level = level;
  $("caffeine-mg").textContent = `${mg.toLocaleString("pl-PL")} mg`;
  $("caffeine-fill").style.width = `${Math.min(100, (mg / caffeineMeter.maxMg) * 100)}%`;
  $("caffeine-bar").setAttribute("aria-valuenow", Math.min(mg, caffeineMeter.maxMg));
  $("caffeine-bar").setAttribute("aria-valuetext", warning ? `${mg} mg, ${warning.toLowerCase()}` : `${mg} mg`);
  $("caffeine-note").textContent = warning ?? `Spada o połowę co ${caffeineMeter.halfLifeHours} h`;
}

function render() {
  if (tasks === null || intake === null) return;
  const stats = playerStats(tasks, intake);
  $("level").textContent = String(stats.level).padStart(2, "0");
  $("level-xp").textContent = `${stats.levelXp} / ${xpPerLevel} XP`;
  $("level-bar").max = xpPerLevel;
  $("level-bar").value = stats.levelXp;
  $("xp").textContent = stats.xp;
  $("done").textContent = stats.completed;
  $("active").textContent = stats.active;
  $("caffeine-total").textContent = stats.caffeineMg.toLocaleString("pl-PL");
  renderCaffeine();

  const visible = tasks.filter((task) => filter === "all" || task.wykonane === (filter === "done"));
  $("tasks").replaceChildren(...visible.map(renderTask));
  $("empty").hidden = visible.length > 0;
  const messages = {
    all: ["Brak misji na tablicy", "Dodaj pierwszą misję, aby rozpocząć zbieranie XP."],
    active: ["Brak aktywnych misji", "Nowe misje pojawią się tutaj."],
    done: ["Brak ukończonych misji", "Odhacz pierwsze zadanie na tablicy misji."],
  };
  [$("empty-title").textContent, $("empty-detail").textContent] = messages[filter];
}

function chooseFilter(value) {
  filter = value;
  for (const button of filters) button.setAttribute("aria-pressed", String(button.dataset.filter === value));
  render();
}
for (const button of filters) button.addEventListener("click", () => chooseFilter(button.dataset.filter));

function setBusy(value) {
  busy = value;
  for (const node of document.querySelectorAll("#refresh, #add, #tasks input, #task-form button, #drinks button, #caffeine-undo")) {
    node.disabled = value;
  }
}

function connection(online) {
  $("connection").dataset.online = String(online);
  $("connection").textContent = online ? "API online" : "API offline";
}

function showError(node, error) {
  const offline = ["TypeError", "TimeoutError"].includes(error.name);
  if (offline) {
    connection(false);
  } else {
    $("connection").dataset.online = "false";
    $("connection").textContent = "Błąd API";
  }
  node.textContent = offline ? "Brak połączenia z API. Spróbuj ponownie." : error.message;
  node.hidden = false;
}

async function load() {
  setBusy(true);
  $("notice").hidden = true;
  try {
    [tasks, intake] = await Promise.all([getTasks(), getCaffeine()]);
    connection(true);
    render();
  } catch (error) {
    showError($("notice"), error);
    if (tasks === null) {
      $("empty-title").textContent = "Nie udało się pobrać misji";
      $("empty-detail").textContent = "Użyj przycisku odświeżania obok statusu API.";
    }
  } finally {
    setBusy(false);
  }
}

async function toggleTask(task) {
  setBusy(true);
  $("notice").hidden = true;
  try {
    const updated = await setCompleted(task.id, !task.wykonane);
    tasks = tasks.map((entry) => entry.id === task.id ? updated : entry);
    connection(true);
  } catch (error) {
    showError($("notice"), error);
  } finally {
    setBusy(false);
    render();
    (document.querySelector(`input[data-id="${task.id}"]`) ?? document.querySelector('[data-filter][aria-pressed="true"]')).focus();
  }
}

function caffeineFeedback(text, { undo = false, error = false, resetAfter = 0 } = {}) {
  clearTimeout(feedbackTimer);
  $("caffeine-feedback").textContent = text;
  $("caffeine-feedback-line").classList.toggle("error", error);
  $("caffeine-undo").hidden = !undo;
  if (resetAfter) feedbackTimer = setTimeout(resetFeedback, resetAfter);
}

function resetFeedback() {
  const undoFocused = document.activeElement === $("caffeine-undo");
  const type = lastDrink?.rodzaj;
  lastDrink = null;
  caffeineFeedback(feedbackHint);
  if (undoFocused && type) document.querySelector(`[data-drink="${type}"]`).focus();
}

function caffeineError(error) {
  lastDrink = null;
  caffeineFeedback("", { error: true });
  showError($("caffeine-feedback"), error);
}

function popXp(button, xp) {
  if (reduceMotion.matches) return;
  const pop = element("span", "xp-pop", `+${xp} XP`);
  pop.setAttribute("aria-hidden", "true");
  pop.addEventListener("animationend", () => pop.remove());
  button.append(pop);
}

async function drink(type, button) {
  if (busy) return;
  setBusy(true);
  try {
    const entry = await addCaffeine(type);
    connection(true);
    lastDrink = entry;
    const { label, xp } = drinks[type];
    caffeineFeedback(`${label}: +${entry.mg} mg, +${xp} XP`, { undo: true, resetAfter: 8000 });
    popXp(button, xp);
    if (intake === null) {
      await load();
    } else {
      intake = [...intake, entry];
    }
  } catch (error) {
    caffeineError(error);
  } finally {
    setBusy(false);
    render();
    button.focus();
  }
}

$("caffeine-undo").addEventListener("click", async () => {
  if (busy || !lastDrink) return;
  const entry = lastDrink;
  setBusy(true);
  try {
    await removeCaffeine(entry.id);
    intake = intake?.filter((item) => item.id !== entry.id) ?? null;
    connection(true);
    lastDrink = null;
    caffeineFeedback(`Cofnięto: ${drinks[entry.rodzaj].label}`, { resetAfter: 4000 });
  } catch (error) {
    caffeineError(error);
  } finally {
    setBusy(false);
    render();
    document.querySelector(`[data-drink="${entry.rodzaj}"]`).focus();
  }
});

setInterval(renderCaffeine, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderCaffeine(); });

$("refresh").addEventListener("click", load);
$("add").addEventListener("click", () => {
  $("form-error").hidden = true;
  dialog.showModal();
});
$("close").addEventListener("click", () => dialog.close());
$("cancel").addEventListener("click", () => dialog.close());
dialog.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
form.elements.tytul.addEventListener("input", () => form.elements.tytul.setCustomValidity(""));
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const data = Object.fromEntries(new FormData(form));
  data.tytul = data.tytul.trim();
  if (!data.tytul) {
    form.elements.tytul.setCustomValidity("Wpisz nazwę misji.");
    form.elements.tytul.reportValidity();
    return;
  }
  data.termin ||= null;
  setBusy(true);
  $("form-error").hidden = true;
  try {
    const created = await createTask(data);
    dialog.close();
    form.reset();
    if (tasks === null) {
      await load();
    } else {
      tasks = [...tasks, created];
      $("notice").hidden = true;
      connection(true);
      chooseFilter("all");
    }
  } catch (error) {
    showError($("form-error"), error);
  } finally {
    setBusy(false);
    if (!dialog.open) $("add").focus();
  }
});

load();
