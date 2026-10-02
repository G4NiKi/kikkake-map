import { useState } from 'preact/hooks';
import { LoopDialog } from '../components/LoopDialog';
import { Scale } from '../components/Scale';
import { Sheet } from '../components/Sheet';
import { actionById, doneDaysLast7, needsGrow, needsShrink, todayStr } from '../logic';
import { getData, now, uid, update, useData } from '../store';
import type { LogEntry, Recipe } from '../types';

export function Today() {
  const data = useData();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [loop, setLoop] = useState<{ recipe: Recipe; mode: 'shrink' | 'grow' } | null>(null);

  const today = todayStr();
  const recipes = data.recipes.filter((r) => r.active);
  const detail = data.logs.find((l) => l.id === detailId);
  const doneDays = doneDaysLast7(data.logs);

  const record = (recipe: Recipe, done: boolean) => {
    let id = '';
    update((d) => {
      const existing = d.logs.find((l) => l.recipeId === recipe.id && l.date === today);
      if (existing) {
        existing.done = done;
        existing.updatedAt = now();
        id = existing.id;
      } else {
        const log: LogEntry = { id: uid(), recipeId: recipe.id, date: today, done, createdAt: now(), updatedAt: now() };
        d.logs.push(log);
        id = log.id;
      }
    });
    setDetailId(id);
  };

  const closeDetail = () => {
    const log = detail;
    setDetailId(null);
    if (!log) return;
    const d = getData();
    const recipe = d.recipes.find((r) => r.id === log.recipeId);
    if (!recipe) return;
    if (!log.done && needsShrink(d, recipe)) setLoop({ recipe, mode: 'shrink' });
    else if (log.done && needsGrow(d, recipe)) setLoop({ recipe, mode: 'grow' });
  };

  const patchLog = (patch: Partial<LogEntry>) => {
    update((d) => {
      const l = d.logs.find((x) => x.id === detailId);
      if (l) Object.assign(l, patch, { updatedAt: now() });
    });
  };

  return (
    <main class="screen">
      <header class="today-head">
        <p class="goal">{data.goal}</p>
        <p class="week">
          この7日間でできた日 <strong>{doneDays}</strong>
          <span class="muted"> / 7</span>
        </p>
      </header>

      {recipes.length === 0 && (
        <div class="empty">
          <p>まだレシピがありません。</p>
          <a class="btn primary" href="#/manage">
            行動とレシピを登録する
          </a>
        </div>
      )}

      {recipes.map((r) => {
        const log = data.logs.find((l) => l.recipeId === r.id && l.date === today);
        const names = r.actionIds.map((id) => actionById(data, id)?.name ?? '(削除された行動)');
        return (
          <section class="card recipe-card">
            <p class="anchor">{r.anchor}</p>
            <p class="action-names">→ {names.join(' と ')}</p>
            <div class="record-row">
              <button class={log?.done === true ? 'btn done on' : 'btn done'} onClick={() => record(r, true)}>
                できた
              </button>
              <button class={log?.done === false ? 'btn miss on' : 'btn miss'} onClick={() => record(r, false)}>
                できなかった
              </button>
            </div>
            {log && (
              <button class="link" onClick={() => setDetailId(log.id)}>
                {log.done ? '記録済み:できた' : '記録済み:できなかった'}
                {log.youtube ? '・YouTubeに流れた' : ''} — 詳細
              </button>
            )}
          </section>
        );
      })}

      {detail && (
        <Sheet onClose={closeDetail}>
          {detail.done ? (
            <p class="celebrate">
              {data.recipes.find((r) => r.id === detail.recipeId)?.celebration || 'よし!'}
            </p>
          ) : (
            <p class="sheet-title">記録しました</p>
          )}
          <div class="stack">
            <p class="muted">いまの感覚(省略してもOK)</p>
            <Scale label="やりたさ" value={detail.want} optional onChange={(v) => patchLog({ want: v })} />
            <Scale label="やりやすさ" value={detail.ease} optional onChange={(v) => patchLog({ ease: v })} />
            <label class="check">
              <input
                type="checkbox"
                checked={!!detail.youtube}
                onChange={(e) => patchLog({ youtube: e.currentTarget.checked })}
              />
              YouTubeに流れた
            </label>
            <button class="btn primary big" onClick={closeDetail}>
              閉じる
            </button>
          </div>
        </Sheet>
      )}

      {loop && <LoopDialog recipe={loop.recipe} mode={loop.mode} onClose={() => setLoop(null)} />}
    </main>
  );
}
