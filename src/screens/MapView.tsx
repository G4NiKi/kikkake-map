import { useEffect, useState } from 'preact/hooks';
import { addEvent, update, useData } from '../store';
import type { Action } from '../types';

const W = 340;
const H = 340;
const PAD_L = 34;
const PAD_B = 34;
const PAD_T = 12;
const PAD_R = 12;
const MIN = 0.5;
const MAX = 5.5;

const sx = (ease: number) => PAD_L + ((ease - MIN) / (MAX - MIN)) * (W - PAD_L - PAD_R);
const sy = (want: number) => H - PAD_B - ((want - MIN) / (MAX - MIN)) * (H - PAD_B - PAD_T);

// やりたさ×やりやすさ=しきい値 の曲線
function curvePoints(t: number): [number, number][] {
  const pts: [number, number][] = [];
  const start = Math.max(MIN, t / MAX);
  for (let x = start; x <= MAX + 1e-9; x += 0.05) {
    pts.push([x, Math.min(MAX, t / x)]);
  }
  return pts;
}

// 同じ座標の点が重ならないよう少しずらす
function layout(actions: Action[]): Map<string, { x: number; y: number }> {
  const groups = new Map<string, Action[]>();
  for (const a of actions) {
    const k = `${a.ease},${a.want}`;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  const pos = new Map<string, { x: number; y: number }>();
  for (const g of groups.values()) {
    g.forEach((a, i) => {
      const r = g.length > 1 ? 9 : 0;
      const ang = (i / g.length) * Math.PI * 2 - Math.PI / 2;
      pos.set(a.id, { x: sx(a.ease) + r * Math.cos(ang), y: sy(a.want) + r * Math.sin(ang) });
    });
  }
  return pos;
}

export function MapView() {
  const data = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    update((d) => addEvent(d, { type: 'map_viewed' }));
  }, []);

  const t = data.threshold;
  const curve = curvePoints(t);
  const curvePath = curve.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ');
  const areaPath = curve.length
    ? `${curvePath} L${sx(MAX)},${sy(MAX)} L${sx(curve[0][0])},${sy(MAX)} Z`
    : '';
  const pos = layout(data.actions);
  const selected = data.actions.find((a) => a.id === selectedId);
  const trails = data.actions.filter((a) => a.parentId && pos.has(a.parentId));

  return (
    <main class="screen">
      <h1 class="screen-title">マップ</h1>
      <div class="card map-card">
        <svg viewBox={`0 0 ${W} ${H}`} class="map" role="img" aria-label="やりたさとやりやすさのマップ">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" class="trail-head" />
            </marker>
          </defs>
          {areaPath && <path d={areaPath} class="able-area" />}
          {[1, 2, 3, 4, 5].map((n) => (
            <g>
              <line x1={sx(n)} x2={sx(n)} y1={sy(MIN)} y2={sy(MAX)} class="grid" />
              <line x1={sx(MIN)} x2={sx(MAX)} y1={sy(n)} y2={sy(n)} class="grid" />
              <text x={sx(n)} y={H - PAD_B + 16} class="tick" text-anchor="middle">
                {n}
              </text>
              <text x={PAD_L - 10} y={sy(n) + 4} class="tick" text-anchor="end">
                {n}
              </text>
            </g>
          ))}
          <text x={(W + PAD_L) / 2} y={H - 4} class="axis" text-anchor="middle">
            やりやすさ →
          </text>
          <text x={10} y={(H - PAD_B) / 2} class="axis" text-anchor="middle" transform={`rotate(-90 10 ${(H - PAD_B) / 2})`}>
            やりたさ →
          </text>
          {curvePath && <path d={curvePath} class="action-line" />}
          <text x={sx(MAX) - 4} y={sy(MAX) + 14} class="zone" text-anchor="end">
            できる側
          </text>
          <text x={sx(MIN) + 6} y={sy(MIN) - 8} class="zone">
            できない側
          </text>

          {trails.map((a) => {
            const from = pos.get(a.parentId!)!;
            const to = pos.get(a.id)!;
            return <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} class="trail" marker-end="url(#arrow)" />;
          })}

          {data.actions.map((a) => {
            const p = pos.get(a.id)!;
            const cls = `pt ${a.kind}${a.archived ? ' archived' : ''}${a.id === selectedId ? ' sel' : ''}`;
            const label = a.name.length > 8 ? a.name.slice(0, 8) + '…' : a.name;
            // 右寄りの点はラベルを左側に出して、はみ出さないようにする
            const left = a.ease >= 4;
            return (
              <g class={cls} onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}>
                <circle cx={p.x} cy={p.y} r={18} class="hit" />
                {a.kind === 'competitor' ? (
                  <rect x={p.x - 7} y={p.y - 7} width={14} height={14} rx={2} class="mark" />
                ) : (
                  <circle cx={p.x} cy={p.y} r={a.archived ? 5 : 7} class="mark" />
                )}
                {!a.archived && (
                  <text x={left ? p.x - 11 : p.x + 11} y={p.y + 4} class="pt-label" text-anchor={left ? 'end' : 'start'}>
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div class="legend">
          <span>
            <i class="lg action" />行動
          </span>
          <span>
            <i class="lg competitor" />競合行動
          </span>
          <span>
            <i class="lg archived" />小さくする前
          </span>
          <span>
            <i class="lg line" />アクションライン(={t})
          </span>
        </div>
      </div>

      {selected && <PointInfo action={selected} threshold={t} />}
      {!selected && <p class="muted center">点をタップすると詳しく見られます</p>}
    </main>
  );
}

function PointInfo({ action, threshold }: { action: Action; threshold: number }) {
  const score = action.want * action.ease;
  const above = score >= threshold;
  let note: string;
  if (action.kind === 'competitor') {
    note = above
      ? 'ラインより上にあります。きっかけがあればすぐ始まってしまう位置です。'
      : 'ラインより下にあります。';
  } else if (action.archived) {
    note = 'すでに小さくした(置き換えた)行動です。';
  } else if (above) {
    note = 'ラインより上にあります。それでもできない日は「きっかけ不足」を疑ってみましょう。';
  } else if (action.ease < action.want) {
    note = 'ラインより下にあります。やりたさより「やりやすさ不足」。行動を小さくすると右へ動きます。';
  } else {
    note = 'ラインより下にあります。やりたさが低めです。別の行動を選び直すのも手です。';
  }
  return (
    <section class="card">
      <h2 class="info-title">{action.name}</h2>
      <p>
        やりたさ {action.want} × やりやすさ {action.ease} = <strong>{score}</strong>
        <span class="muted">(ライン {threshold})</span>
      </p>
      <p class="muted">{note}</p>
      {!action.archived && (
        <a class="link" href={`#/manage?edit=${action.id}`}>
          この行動を編集する
        </a>
      )}
    </section>
  );
}
