import { useState } from 'preact/hooks';
import type { Action } from '../types';
import { Scale } from './Scale';

interface Props {
  actions: Action[]; // 置き換え対象の候補
  direction: 'shrink' | 'grow';
  onSubmit: (oldId: string, next: { name: string; want: number; ease: number }) => void;
  onCancel: () => void;
}

const clamp = (n: number) => Math.min(5, Math.max(1, n));

// 行動を小さく(大きく)した新しい行動を入力するフォーム
export function ResizeForm({ actions, direction, onSubmit, onCancel }: Props) {
  const [targetId, setTargetId] = useState(actions[0]?.id);
  const target = actions.find((a) => a.id === targetId) ?? actions[0];
  const [name, setName] = useState('');
  const [want, setWant] = useState<number | undefined>(target?.want);
  const [ease, setEase] = useState<number | undefined>(
    target ? clamp(target.ease + (direction === 'shrink' ? 1 : -1)) : undefined,
  );

  if (!target) return null;
  const shrink = direction === 'shrink';

  return (
    <form
      class="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !want || !ease) return;
        onSubmit(target.id, { name: name.trim(), want, ease });
      }}
    >
      {actions.length > 1 && (
        <div class="chips">
          {actions.map((a) => (
            <button
              type="button"
              class={a.id === target.id ? 'chip on' : 'chip'}
              onClick={() => {
                setTargetId(a.id);
                setWant(a.want);
                setEase(clamp(a.ease + (shrink ? 1 : -1)));
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
      <p class="muted">
        いまの行動:<strong>{target.name}</strong>
      </p>
      <label class="field">
        <span class="field-label">{shrink ? 'もっと小さな行動' : '少し大きな行動'}</span>
        <input
          type="text"
          value={name}
          placeholder={shrink ? '例:ギターを手に取るだけ' : '例:1フレーズを3回弾く'}
          onInput={(e) => setName(e.currentTarget.value)}
          autoFocus
        />
      </label>
      <Scale label="やりたさ" value={want} onChange={setWant} />
      <Scale label="やりやすさ" value={ease} onChange={setEase} />
      <div class="row">
        <button type="button" class="btn ghost" onClick={onCancel}>
          戻る
        </button>
        <button type="submit" class="btn primary" disabled={!name.trim() || !want || !ease}>
          {shrink ? 'この大きさでやってみる' : '大きくする'}
        </button>
      </div>
    </form>
  );
}
