export const priorities = {
  niski: { label: "Niski", xp: 10 },
  sredni: { label: "Średni", xp: 25 },
  wysoki: { label: "Wysoki", xp: 50 },
};

export const xpPerLevel = 100;

export function remainingMg(mg, updatedAt, now = Date.now()) {
  const hours = Math.max(0, now - updatedAt) / 3_600_000;
  return mg * 0.5 ** (hours / 4);
}

export function xpMultiplier(mg) {
  return mg === 0 ? 1 : Math.min(mg / 100, 4);
}

export function playerStats(tasks) {
  let hundredths = 0;
  for (const task of tasks) {
    if (task.wykonane) {
      hundredths += Math.round(priorities[task.priorytet].xp * task.mnoznik_xp * 100);
    }
  }
  return {
    level: 1 + Math.floor(hundredths / (100 * xpPerLevel)),
    levelXp: (hundredths % (100 * xpPerLevel)) / 100,
  };
}
