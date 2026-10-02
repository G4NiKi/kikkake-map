import { addEvent, now, uid } from './store';
import type { Action, AppData, LogEntry, Recipe } from './types';

export function dateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayStr(): string {
  return dateStr(new Date());
}

// この7日間(今日を含む)で「できた」が1件以上ある日の数
export function doneDaysLast7(logs: LogEntry[]): number {
  const days = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.add(dateStr(d));
  }
  const done = new Set(logs.filter((l) => l.done && days.has(l.date)).map((l) => l.date));
  return done.size;
}

function loopLogs(data: AppData, recipe: Recipe): LogEntry[] {
  return data.logs
    .filter((l) => l.recipeId === recipe.id && (!recipe.loopResetDate || l.date > recipe.loopResetDate))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 同じレシピで「できなかった」が2回続いたか
export function needsShrink(data: AppData, recipe: Recipe): boolean {
  const logs = loopLogs(data, recipe);
  return logs.length >= 2 && logs.slice(-2).every((l) => !l.done);
}

// 5回連続で「できた」か
export function needsGrow(data: AppData, recipe: Recipe): boolean {
  const logs = loopLogs(data, recipe);
  return logs.length >= 5 && logs.slice(-5).every((l) => l.done);
}

// 「夕食後」のような短く曖昧なアンカーかどうか。厳密さは求めない
export function isVagueAnchor(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/直後|たら|瞬間/.test(t)) return false;
  return t.length <= 8;
}

export function actionById(data: AppData, id: string): Action | undefined {
  return data.actions.find((a) => a.id === id);
}

// 行動を置き換える(小さくする/大きくする)。元の行動は軌跡用に残し、レシピ内の参照を差し替える
export function replaceAction(
  d: AppData,
  oldId: string,
  next: { name: string; want: number; ease: number },
): Action {
  const old = d.actions.find((a) => a.id === oldId)!;
  const created: Action = {
    id: uid(),
    name: next.name,
    kind: old.kind,
    want: next.want,
    ease: next.ease,
    parentId: old.id,
    createdAt: now(),
  };
  old.archived = true;
  d.actions.push(created);
  for (const r of d.recipes) {
    r.actionIds = r.actionIds.map((id) => (id === oldId ? created.id : id));
  }
  return created;
}

export function changeAnchor(d: AppData, recipeId: string, anchor: string, source: 'loop' | 'manual') {
  const r = d.recipes.find((x) => x.id === recipeId)!;
  if (r.anchor === anchor) return;
  r.anchorHistory.push({ anchor: r.anchor, changedAt: now() });
  r.anchor = anchor;
  addEvent(d, { type: 'anchor_changed', recipeId, source });
}

export function resetLoop(d: AppData, recipeId: string) {
  const r = d.recipes.find((x) => x.id === recipeId)!;
  r.loopResetDate = todayStr();
}
