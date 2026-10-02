import { useState } from 'preact/hooks';
import { AnchorInput } from '../components/AnchorInput';
import { ResizeForm } from '../components/ResizeForm';
import { Scale } from '../components/Scale';
import { Sheet } from '../components/Sheet';
import { actionById, changeAnchor, replaceAction } from '../logic';
import { addEvent, now, uid, update, useData } from '../store';
import type { Action, Kind, Recipe } from '../types';

export function Manage({ editId }: { editId?: string }) {
  const data = useData();
  const [actionEdit, setActionEdit] = useState<Action | 'new' | null>(
    () => data.actions.find((a) => a.id === editId) ?? null,
  );
  const [recipeEdit, setRecipeEdit] = useState<Recipe | 'new' | null>(null);

  const live = data.actions.filter((a) => !a.archived);

  return (
    <main class="screen">
      <h1 class="screen-title">行動とレシピ</h1>
      <p class="muted">目標:{data.goal}</p>

      <section class="section">
        <div class="section-head">
          <h2>レシピ</h2>
          <button class="btn small" onClick={() => setRecipeEdit('new')}>
            + 追加
          </button>
        </div>
        {data.recipes.length === 0 && <p class="muted">「〈アンカー〉したら、〈行動〉する」を作りましょう。</p>}
        {data.recipes.map((r) => (
          <button class={r.active ? 'card list-item' : 'card list-item off'} onClick={() => setRecipeEdit(r)}>
            <span class="anchor">{r.anchor}</span>
            <span>→ {r.actionIds.map((id) => actionById(data, id)?.name ?? '?').join(' と ')}</span>
            {!r.active && <span class="badge">休止中</span>}
          </button>
        ))}
      </section>

      <section class="section">
        <div class="section-head">
          <h2>行動</h2>
          <button class="btn small" onClick={() => setActionEdit('new')}>
            + 追加
          </button>
        </div>
        {live.map((a) => (
          <button class="card list-item" onClick={() => setActionEdit(a)}>
            <span>
              {a.kind === 'competitor' && <span class="badge competitor">競合</span>}
              {a.name}
            </span>
            <span class="muted small">
              やりたさ {a.want}・やりやすさ {a.ease}
            </span>
          </button>
        ))}
      </section>

      {actionEdit && <ActionEditor action={actionEdit === 'new' ? null : actionEdit} onClose={() => setActionEdit(null)} />}
      {recipeEdit && (
        <RecipeEditor
          recipe={recipeEdit === 'new' ? null : recipeEdit}
          actions={live.filter((a) => a.kind === 'action')}
          onClose={() => setRecipeEdit(null)}
        />
      )}
    </main>
  );
}

function ActionEditor({ action, onClose }: { action: Action | null; onClose: () => void }) {
  const data = useData();
  const [name, setName] = useState(action?.name ?? '');
  const [kind, setKind] = useState<Kind>(action?.kind ?? 'action');
  const [want, setWant] = useState<number | undefined>(action?.want ?? 3);
  const [ease, setEase] = useState<number | undefined>(action?.ease ?? 3);
  const [resizing, setResizing] = useState(false);

  const used = action && data.recipes.some((r) => r.actionIds.includes(action.id));
  const hasChildren = action && data.actions.some((a) => a.parentId === action.id);

  if (resizing && action) {
    return (
      <Sheet title="行動を小さくする" onClose={onClose}>
        <ResizeForm
          actions={[action]}
          direction="shrink"
          onCancel={() => setResizing(false)}
          onSubmit={(oldId, next) => {
            update((d) => {
              const created = replaceAction(d, oldId, next);
              addEvent(d, { type: 'shrunk', actionId: created.id, source: 'manual' });
            });
            onClose();
          }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title={action ? '行動を編集' : '行動を追加'} onClose={onClose}>
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !want || !ease) return;
          update((d) => {
            if (action) {
              const a = d.actions.find((x) => x.id === action.id)!;
              if (a.name !== name.trim() || a.want !== want || a.ease !== ease || a.kind !== kind) {
                Object.assign(a, { name: name.trim(), want, ease, kind });
                addEvent(d, { type: 'action_edited', actionId: a.id, source: 'manual' });
              }
            } else {
              d.actions.push({ id: uid(), name: name.trim(), kind, want, ease, createdAt: now() });
            }
          });
          onClose();
        }}
      >
        <label class="field">
          <span class="field-label">名前</span>
          <input
            type="text"
            value={name}
            placeholder="例:ギターを手に取って1フレーズ弾く"
            onInput={(e) => setName(e.currentTarget.value)}
          />
        </label>
        <div class="chips">
          <button type="button" class={kind === 'action' ? 'chip on' : 'chip'} onClick={() => setKind('action')}>
            行動
          </button>
          <button type="button" class={kind === 'competitor' ? 'chip on' : 'chip'} onClick={() => setKind('competitor')}>
            競合行動
          </button>
        </div>
        <Scale label="やりたさ" value={want} onChange={setWant} />
        <Scale label="やりやすさ" value={ease} onChange={setEase} />
        <button type="submit" class="btn primary big" disabled={!name.trim()}>
          保存
        </button>
        {action && action.kind === 'action' && (
          <button type="button" class="btn big" onClick={() => setResizing(true)}>
            もっと小さくした行動を作る
          </button>
        )}
        {action && !used && !hasChildren && (
          <button
            type="button"
            class="btn ghost danger"
            onClick={() => {
              if (!confirm(`「${action.name}」を削除しますか?`)) return;
              update((d) => {
                d.actions = d.actions.filter((a) => a.id !== action.id);
              });
              onClose();
            }}
          >
            削除
          </button>
        )}
      </form>
    </Sheet>
  );
}

function RecipeEditor({ recipe, actions, onClose }: { recipe: Recipe | null; actions: Action[]; onClose: () => void }) {
  const [anchor, setAnchor] = useState(recipe?.anchor ?? '');
  const [actionIds, setActionIds] = useState<string[]>(recipe?.actionIds ?? []);
  const [celebration, setCelebration] = useState(recipe?.celebration ?? '');
  const [active, setActive] = useState(recipe?.active ?? true);

  const toggle = (id: string) => {
    if (actionIds.includes(id)) setActionIds(actionIds.filter((x) => x !== id));
    else if (actionIds.length < 2) setActionIds([...actionIds, id]);
  };
  const valid = anchor.trim() && actionIds.length >= 1;

  return (
    <Sheet title={recipe ? 'レシピを編集' : 'レシピを作る'} onClose={onClose}>
      <form
        class="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          update((d) => {
            if (recipe) {
              const r = d.recipes.find((x) => x.id === recipe.id)!;
              changeAnchor(d, r.id, anchor.trim(), 'manual');
              Object.assign(r, { actionIds, celebration: celebration.trim(), active });
            } else {
              d.recipes.push({
                id: uid(),
                anchor: anchor.trim(),
                actionIds,
                celebration: celebration.trim(),
                active: true,
                anchorHistory: [],
                createdAt: now(),
              });
            }
          });
          onClose();
        }}
      >
        <AnchorInput value={anchor} onInput={setAnchor} />
        <div class="field">
          <span class="field-label">行動(1〜2個)</span>
          {actions.length === 0 && <span class="hint">先に「行動」を追加してください</span>}
          <div class="chips">
            {actions.map((a) => (
              <button type="button" class={actionIds.includes(a.id) ? 'chip on' : 'chip'} onClick={() => toggle(a.id)}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
        <label class="field">
          <span class="field-label">お祝いの一言</span>
          <input
            type="text"
            value={celebration}
            placeholder="例:いいぞ、音が鳴った!"
            onInput={(e) => setCelebration(e.currentTarget.value)}
          />
        </label>
        {recipe && (
          <label class="check">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.currentTarget.checked)} />
            今日の画面に表示する
          </label>
        )}
        <button type="submit" class="btn primary big" disabled={!valid}>
          保存
        </button>
        {recipe && (
          <button
            type="button"
            class="btn ghost danger"
            onClick={() => {
              if (!confirm('このレシピと、その記録を削除しますか?')) return;
              update((d) => {
                d.recipes = d.recipes.filter((r) => r.id !== recipe.id);
                d.logs = d.logs.filter((l) => l.recipeId !== recipe.id);
              });
              onClose();
            }}
          >
            削除
          </button>
        )}
      </form>
    </Sheet>
  );
}
