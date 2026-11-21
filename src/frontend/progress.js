export const priorities = {
  niski: { label: "Niski", xp: 10 },
  sredni: { label: "Średni", xp: 25 },
  wysoki: { label: "Wysoki", xp: 50 },
};

export const xpPerLevel = 100;

export function playerStats(tasks) {
  const completed = tasks.filter((task) => task.wykonane);
  const xp = completed.reduce((sum, task) => sum + priorities[task.priorytet].xp, 0);
  return {
    completed: completed.length,
    active: tasks.length - completed.length,
    xp,
    level: 1 + Math.floor(xp / xpPerLevel),
    levelXp: xp % xpPerLevel,
  };
}
