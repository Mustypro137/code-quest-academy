import { getStats, levelInfo, recordAchievements } from '../store.js';
import { evaluateAchievements } from '../achievements.js';
import { esc, bar } from './html.js';

const TOAST_MS = 6000;

function toast(html) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  box.append(el);
  setTimeout(() => el.remove(), TOAST_MS);
}

// The level and XP chip in the top bar.
export function updateChip() {
  const chip = document.getElementById('xp-chip');
  if (!chip) return;
  const { xp } = getStats();
  const info = levelInfo(xp);
  chip.innerHTML = `<span>Lv ${info.level}</span>${bar(info.percent, 'Progress to the next level')}<span>${xp} XP</span><span class="sr-only">. Open your progress.</span>`;
}

// Shows a calm toast for a level-up or a new achievement. Nothing else pops up.
export function initRewards(modules) {
  updateChip();
  // Achievements you already earned are saved quietly, so only new ones get a toast.
  recordAchievements(evaluateAchievements(modules).filter((a) => a.unlocked).map((a) => a.id));

  window.addEventListener('cqa:progress', ({ detail }) => {
    updateChip();
    const before = levelInfo(detail.xpBefore).level;
    const after = levelInfo(detail.xpAfter).level;
    if (after > before) toast(`<strong>🎉 Level ${after}!</strong> Keep going.`);
    const fresh = recordAchievements(evaluateAchievements(modules).filter((a) => a.unlocked).map((a) => a.id));
    for (const a of evaluateAchievements(modules).filter((x) => fresh.includes(x.id))) {
      toast(`<strong>${esc(a.icon)} ${esc(a.title)}</strong> ${esc(a.text)}`);
    }
  });
}
