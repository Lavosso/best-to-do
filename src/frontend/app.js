import { createTask, getTasks, setCompleted } from "./api.js";
import { playerStats, priorities, remainingMg, taskReward, xpMultiplier } from "./progress.js";

const $ = (id) => document.getElementById(id);
const form = $("task-form");
const dialog = $("editor");
const filters = document.querySelectorAll("[data-filter]");
const caffeineForm = $("caffeine-form");
const caffeineBar = $("caffeine-bar");
const tagFilter = $("tag-filter");
const priorityOrder = $("priority-order");
const empty = $("empty");
const taskList = $("tasks");
const taskRow = $("task-row").content.firstElementChild;
const notice = $("notice");
const formError = $("form-error");
let tasks = null;
let caffeineMg = 0;
let updatedAt = Date.now();
let multiplier;
let filter = "active";
let busy = false;
let previousLevel = null;
let levelUpTimer;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

for (const [value, { label }] of Object.entries(priorities)) {
  form.elements.priorytet.add(new Option(label, value, value === "sredni", value === "sredni"));
}

function formatReward(priority, factor) {
  return `+${taskReward(priority, factor).toLocaleString("pl-PL")} XP`;
}

function renderTask(task) {
  const item = taskRow.cloneNode(true);
  const toggle = item.querySelector("input");
  toggle.checked = task.wykonane;
  toggle.dataset.id = task.id;
  toggle.disabled = busy;
  toggle.setAttribute("aria-label", `Ukończono: ${task.tytul}`);
  toggle.addEventListener("change", () => toggleTask(task));
  item.classList.toggle("completed", task.wykonane);
  item.querySelector("h3").textContent = task.tytul;
  const description = item.querySelector("p");
  description.textContent = task.opis;
  description.hidden = !task.opis;
  const meta = item.querySelector(".metadata");
  const priority = meta.querySelector(".priority");
  priority.classList.add(task.priorytet);
  priority.textContent = priorities[task.priorytet].label;
  if (task.termin) {
    const date = element("time", "", `Termin: ${new Date(task.termin + "T00:00:00").toLocaleDateString("pl-PL")}`);
    date.dateTime = task.termin;
    meta.append(date);
  }
  for (const tag of task.tagi) {
    if (tag) meta.append(element("span", "task-tag", "#" + tag));
  }
  const reward = item.querySelector(".task-xp");
  reward.textContent = formatReward(task.priorytet, task.wykonane ? task.mnoznik_xp : multiplier);
  if (!task.wykonane) reward.dataset.priority = task.priorytet;
  return item;
}

function renderCaffeine() {
  const mg = Math.round(remainingMg(caffeineMg, updatedAt));
  const nextMultiplier = xpMultiplier(mg);
  const level = mg > 800 ? "very-high" : mg > 600 ? "high" : "normal";
  const warning = mg >= caffeineBar.max
    ? "Motywacja? Jaka k*** motywacja?"
    : { high: "Wysokie stężenie", "very-high": "Bardzo wysokie stężenie!" }[level];
  $("caffeine").dataset.level = level;
  $("caffeine-mg").textContent = `${mg.toLocaleString("pl-PL")} mg`;
  caffeineBar.value = Math.min(mg, caffeineBar.max);
  caffeineBar.setAttribute("aria-valuetext", warning ? `${mg} mg, ${warning}` : `${mg} mg`);
  $("caffeine-note").textContent = warning ?? "";
  $("caffeine-note").hidden = !warning;
  if (nextMultiplier === multiplier) return;
  multiplier = nextMultiplier;
  $("multiplier").textContent = `×${multiplier.toLocaleString("pl-PL")}`;
  for (const reward of taskList.querySelectorAll("[data-priority]")) {
    reward.textContent = formatReward(reward.dataset.priority, multiplier);
  }
}

function renderProgress() {
  const stats = playerStats(tasks);
  $("level").textContent = stats.level;
  $("level-xp").textContent = `${stats.levelXp.toLocaleString("pl-PL")} / ${stats.levelTarget.toLocaleString("pl-PL")} XP`;
  $("level-bar").max = stats.levelTarget;
  $("level-bar").value = stats.levelXp;
  if (previousLevel !== null && stats.level !== previousLevel) {
    const status = $("level-up");
    clearTimeout(levelUpTimer);
    if (stats.level > previousLevel) {
      status.replaceChildren(element("span", "level-up-message", `Nowy poziom · ${stats.level}`));
      levelUpTimer = setTimeout(() => status.replaceChildren(), 3500);
    } else {
      status.replaceChildren();
    }
  }
  previousLevel = stats.level;
}

function renderTagOptions() {
  const selected = tagFilter.value;
  const tags = [...new Set(tasks.flatMap((task) => task.tagi).filter(Boolean))];
  tags.sort((a, b) => a.localeCompare(b, "pl"));
  tagFilter.length = 1;
  for (const tag of tags) tagFilter.add(new Option(`#${tag}`, tag));
  tagFilter.value = tags.includes(selected) ? selected : "";
  tagFilter.hidden = tags.length === 0;
}

function renderTasks() {
  const done = filter === "done";
  for (const button of filters) button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  priorityOrder.hidden = done;
  if (tasks === null) return;

  const tag = tagFilter.value;
  const visible = tasks.filter((task) => task.wykonane === done && (!tag || task.tagi.includes(tag)));
  if (!done) {
    const direction = priorityOrder.value === "asc" ? 1 : -1;
    visible.sort((a, b) => direction * (priorities[a.priorytet].xp - priorities[b.priorytet].xp));
  }

  const rows = document.createDocumentFragment();
  for (const task of visible) rows.append(renderTask(task));
  taskList.replaceChildren(rows);
  empty.hidden = visible.length > 0;
  if (!empty.hidden) {
    const description = done ? "ukończonych" : "aktywnych";
    empty.textContent = `Brak ${description} misji${tag ? ` z tagiem #${tag}` : ""}`;
  }
}

for (const button of filters) {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    renderTasks();
  });
}
tagFilter.addEventListener("change", renderTasks);
priorityOrder.addEventListener("change", renderTasks);

function setBusy(value) {
  busy = value;
  for (const node of [$("add"), ...form.elements, ...taskList.querySelectorAll("input")]) {
    node.disabled = value;
  }
}

async function run(action) {
  if (busy) return;
  setBusy(true);
  notice.hidden = formError.hidden = true;
  try {
    await action();
  } catch (error) {
    const box = dialog.open ? formError : notice;
    const offline = ["TypeError", "TimeoutError"].includes(error.name);
    box.textContent = offline ? "Brak połączenia z API. Spróbuj ponownie." : error.message;
    box.hidden = false;
    if (tasks === null) empty.hidden = true;
  } finally {
    setBusy(false);
    renderTasks();
  }
}

async function fetchJournal() {
  tasks = await getTasks();
  renderTagOptions();
  renderProgress();
}

async function toggleTask(task) {
  await run(async () => {
    renderCaffeine();
    const updated = await setCompleted(task.id, !task.wykonane, task.wykonane ? undefined : multiplier);
    tasks = tasks.map((entry) => entry.id === task.id ? updated : entry);
    renderProgress();
  });
  if (document.activeElement === document.body) {
    (taskList.querySelector(`input[data-id="${task.id}"]`) ?? document.querySelector('[data-filter][aria-pressed="true"]')).focus();
  }
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
setInterval(() => { if (caffeineMg && !document.hidden) renderCaffeine(); }, 60_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderCaffeine(); });

$("add").addEventListener("click", () => {
  formError.hidden = true;
  dialog.showModal();
});
$("cancel").addEventListener("click", () => dialog.close());
dialog.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const data = Object.fromEntries(new FormData(form));
  data.tytul = data.tytul.trim();
  data.termin ||= null;
  data.tagi = [...new Set(data.tagi.split(",").map((tag) => tag.trim().replace(/^#/, "").trim()).filter(Boolean))];
  await run(async () => {
    const created = await createTask(data);
    dialog.close();
    form.reset();
    filter = "active";
    if (tasks) {
      tasks.push(created);
      if (tagFilter.value && !created.tagi.includes(tagFilter.value)) tagFilter.value = "";
      renderTagOptions();
    } else {
      await fetchJournal();
    }
  });
  if (!dialog.open) $("add").focus();
});

run(fetchJournal);
