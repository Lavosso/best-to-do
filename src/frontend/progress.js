export const priorities = {
  niski: { label: "Niski", xp: 10 },
  sredni: { label: "Średni", xp: 25 },
  wysoki: { label: "Wysoki", xp: 50 },
};

// Kolejność kluczy = kolejność przycisków. Ilość mg na porcję definiuje backend (backend/kofeina.py).
export const drinks = {
  kawa: { label: "Kawa", xp: 4 },
  black: { label: "Black", xp: 5 },
  monster: { label: "Monster", xp: 10 },
  dzik: { label: "Dzik", xp: 15 },
};

export const caffeineMeter = {
  halfLifeHours: 4,
  maxMg: 1000,
  stepMg: 100,
  highMg: 600,
  veryHighMg: 800,
};

export const xpPerLevel = 100;

export function playerStats(tasks, intake) {
  const completed = tasks.filter((task) => task.wykonane);
  const taskXp = completed.reduce((sum, task) => sum + priorities[task.priorytet].xp, 0);
  const caffeineXp = intake.reduce((sum, entry) => sum + (drinks[entry.rodzaj]?.xp ?? 0), 0);
  const xp = taskXp + caffeineXp;
  return {
    completed: completed.length,
    active: tasks.length - completed.length,
    caffeineMg: intake.reduce((sum, entry) => sum + entry.mg, 0),
    xp,
    level: 1 + Math.floor(xp / xpPerLevel),
    levelXp: xp % xpPerLevel,
  };
}

export function caffeineInBody(intake, now = Date.now()) {
  const { halfLifeHours, highMg, veryHighMg } = caffeineMeter;
  const halfLifeMs = halfLifeHours * 3_600_000;
  const mg = Math.round(intake.reduce((sum, entry) => {
    const elapsed = Math.max(0, now - Date.parse(entry.czas));
    return sum + entry.mg * 0.5 ** (elapsed / halfLifeMs);
  }, 0));
  const level = mg > veryHighMg ? "very-high" : mg > highMg ? "high" : "normal";
  return { mg, level };
}
