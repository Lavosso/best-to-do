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

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function addReward(list, label, xp, className) {
  const row = document.createElement("div");
  row.append(element("dt", className, label), element("dd", "", `+${xp} XP`));
  $(list).append(row);
}

for (const [value, { label, xp }] of Object.entries(priorities)) {
  form.elements.priorytet.add(new Option(label, value, value === "sredni", value === "sredni"));
  addReward("rewards", label, xp, `priority ${value}`);
}

for (const [type, { label, xp }] of Object.entries(drinks)) {
  const button = element("button", "drink", label);
  button.type = "button";
  button.dataset.drink = type;
  button.title = `${label} · +${xp} XP`;
  button.setAttribute("aria-label", `Dodaj napój: ${label}, +${xp} XP`);
  button.addEventListener("click", () => drink(type, button));
  $("drinks").append(button);
  addReward("drink-rewards", label, xp);
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
  const body = element("div", "task-body");
  body.append(element("h3", "", task.tytul));
  if (task.opis) body.append(element("p", "", task.opis));
  const meta = element("div", "metadata");
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
}
for (const button of filters) {
  button.addEventListener("click", () => {
    chooseFilter(button.dataset.filter);
    render();
  });
}

function setBusy(value) {
  busy = value;
  for (const node of document.querySelectorAll("#refresh, #add, #tasks input, #task-form button, #drinks button, #caffeine-undo")) {
    node.disabled = value;
  }
}

function connection(text) {
  $("connection").dataset.online = String(text === "API online");
  $("connection").textContent = text;
}

function showError(node, error) {
  const offline = ["TypeError", "TimeoutError"].includes(error.name);
  connection(offline ? "API offline" : "Błąd API");
  node.textContent = offline ? "Brak połączenia z API. Spróbuj ponownie." : error.message;
  node.hidden = false;
}

async function run(action, onError = (error) => showError($("notice"), error)) {
  setBusy(true);
  try {
    await action();
  } catch (error) {
    onError(error);
  } finally {
    setBusy(false);
    render();
  }
}

async function fetchJournal() {
  $("notice").hidden = true;
  try {
    [tasks, intake] = await Promise.all([getTasks(), getCaffeine()]);
    connection("API online");
  } catch (error) {
    if (tasks === null) {
      $("empty-title").textContent = "Nie udało się pobrać misji";
      $("empty-detail").textContent = "Użyj przycisku odświeżania obok statusu API.";
    }
    showError($("notice"), error);
  }
}

async function toggleTask(task) {
  $("notice").hidden = true;
  await run(async () => {
    const updated = await setCompleted(task.id, !task.wykonane);
    tasks = tasks.map((entry) => entry.id === task.id ? updated : entry);
    connection("API online");
  });
  (document.querySelector(`input[data-id="${task.id}"]`) ?? document.querySelector('[data-filter][aria-pressed="true"]')).focus();
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
  await run(async () => {
    const entry = await addCaffeine(type);
    connection("API online");
    lastDrink = entry;
    const { label, xp } = drinks[type];
    caffeineFeedback(`${label}: +${entry.mg} mg, +${xp} XP`, { undo: true, resetAfter: 8000 });
    popXp(button, xp);
    if (intake) intake.push(entry);
    else await fetchJournal();
  }, caffeineError);
  button.focus();
}

$("caffeine-undo").addEventListener("click", async () => {
  const entry = lastDrink;
  if (!entry) return;
  await run(async () => {
    await removeCaffeine(entry.id);
    if (intake) intake = intake.filter((item) => item.id !== entry.id);
    connection("API online");
    lastDrink = null;
    caffeineFeedback(`Cofnięto: ${drinks[entry.rodzaj].label}`, { resetAfter: 4000 });
  }, caffeineError);
  document.querySelector(`[data-drink="${entry.rodzaj}"]`).focus();
});

setInterval(renderCaffeine, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderCaffeine(); });

$("refresh").addEventListener("click", () => run(fetchJournal));
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
  $("form-error").hidden = true;
  await run(async () => {
    const created = await createTask(data);
    dialog.close();
    form.reset();
    $("notice").hidden = true;
    if (tasks) {
      tasks.push(created);
      chooseFilter("all");
      connection("API online");
    } else {
      await fetchJournal();
    }
  }, (error) => showError($("form-error"), error));
  if (!dialog.open) $("add").focus();
});

run(fetchJournal);
