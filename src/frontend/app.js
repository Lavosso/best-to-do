import { createTask, getTasks, setCompleted } from "./api.js";
import { playerStats, priorities, remainingMg, xpMultiplier, xpPerLevel } from "./progress.js";

const $ = (id) => document.getElementById(id);
const form = $("task-form");
const dialog = $("editor");
const filters = document.querySelectorAll("[data-filter]");
const caffeineForm = $("caffeine-form");
let tasks = null;
let caffeineMg = 0;
let updatedAt = Date.now();
let filter = "all";
let busy = false;

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

for (const [value, { label }] of Object.entries(priorities)) {
  form.elements.priorytet.add(new Option(label, value, value === "sredni", value === "sredni"));
}

function currentMg() {
  return Math.round(remainingMg(caffeineMg, updatedAt));
}

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
  const reward = element("span", "task-xp");
  if (task.wykonane) {
    reward.textContent = `+${(priority.xp * task.mnoznik_xp).toLocaleString("pl-PL")} XP`;
  } else {
    reward.dataset.baseXp = priority.xp;
  }
  item.append(toggle, body, reward);
  return item;
}

function renderCaffeine() {
  const mg = currentMg();
  const multiplier = xpMultiplier(mg);
  const level = mg > 800 ? "very-high" : mg > 600 ? "high" : "normal";
  const warning = { high: "Wysokie stężenie", "very-high": "Bardzo wysokie stężenie!" }[level];
  $("caffeine").dataset.level = level;
  $("caffeine-mg").textContent = `${mg.toLocaleString("pl-PL")} mg`;
  $("multiplier").textContent = `×${multiplier.toLocaleString("pl-PL")}`;
  $("caffeine-fill").style.width = `${Math.min(100, mg / 10)}%`;
  $("caffeine-bar").setAttribute("aria-valuenow", Math.min(mg, 1000));
  $("caffeine-bar").setAttribute("aria-valuetext", warning ? `${mg} mg, ${warning}` : `${mg} mg`);
  $("caffeine-note").textContent = warning ?? "Spada o połowę co 4 h";
  for (const reward of document.querySelectorAll("[data-base-xp]")) {
    reward.textContent = `+${(reward.dataset.baseXp * multiplier).toLocaleString("pl-PL")} XP`;
  }
}

function render() {
  if (tasks === null) return;
  const stats = playerStats(tasks);
  $("level").textContent = String(stats.level).padStart(2, "0");
  $("level-xp").textContent = `${stats.levelXp.toLocaleString("pl-PL")} / ${xpPerLevel} XP`;
  $("level-bar").max = xpPerLevel;
  $("level-bar").value = stats.levelXp;

  const visible = tasks.filter((task) => filter === "all" || task.wykonane === (filter === "done"));
  $("tasks").replaceChildren(...visible.map(renderTask));
  renderCaffeine();
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
  for (const node of document.querySelectorAll("#refresh, #add, #tasks input, #task-form button")) {
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
    tasks = await getTasks();
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
    const multiplier = task.wykonane ? undefined : xpMultiplier(currentMg());
    const updated = await setCompleted(task.id, !task.wykonane, multiplier);
    tasks = tasks.map((entry) => entry.id === task.id ? updated : entry);
    connection("API online");
  });
  (document.querySelector(`input[data-id="${task.id}"]`) ?? document.querySelector('[data-filter][aria-pressed="true"]')).focus();
}

caffeineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const dose = caffeineForm.elements.mg.valueAsNumber;
  const now = Date.now();
  caffeineMg = remainingMg(caffeineMg, updatedAt, now) + dose;
  updatedAt = now;
  caffeineForm.reset();
  renderCaffeine();
});

renderCaffeine();
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
