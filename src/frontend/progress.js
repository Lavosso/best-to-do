export const priorities = {
  niski: { label: "Niski", xp: 10 },
  sredni: { label: "Średni", xp: 25 },
  wysoki: { label: "Wysoki", xp: 50 },
};

const firstLevelTarget = 100;
const levelTargetStep = 50;
const maxLevelTarget = 1000;

export function remainingMg(mg, updatedAt, now = Date.now()) {
  const hours = Math.max(0, now - updatedAt) / 3_600_000;
  if (mg < 50 && hours > 1) return 0;
  return mg * 0.5 ** (hours / 4);
}

export function xpMultiplier(mg) {
  return Math.max(1, Math.min(mg / 100, 4));
}

export function taskReward(priority, multiplier = 1) {
  return Math.round(priorities[priority].xp * multiplier * 100) / 100;
}

export function playerStats(tasks) {
  // Sumowanie w setnych XP chroni granice poziomów przed błędami zaokrągleń.
  let hundredths = 0;
  for (const task of tasks) {
    if (task.wykonane) {
      hundredths += Math.round(taskReward(task.priorytet, task.mnoznik_xp) * 100);
    }
  }
  let level = 1;
  let levelTarget = firstLevelTarget;
  while (levelTarget < maxLevelTarget && hundredths >= levelTarget * 100) {
    hundredths -= levelTarget * 100;
    level += 1;
    levelTarget += levelTargetStep;
  }
  const targetHundredths = levelTarget * 100;
  return {
    level: level + Math.floor(hundredths / targetHundredths),
    levelXp: (hundredths % targetHundredths) / 100,
    levelTarget,
  };
}
