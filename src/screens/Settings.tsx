import { todayStr } from '../logic';
import { getData, isAppData, replaceAll, update, useData } from '../store';

async function exportJson() {
  const json = JSON.stringify(getData(), null, 2);
  const name = `kikkake-map-${todayStr()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  // iPhone のホーム画面アプリではダウンロードが不安定なので、使えるなら共有シートを使う
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importJson(file: File) {
  try {
    const parsed: unknown = JSON.parse(await file.text());
    if (!isAppData(parsed)) {
      alert('きっかけマップのデータではないようです');
      return;
    }
    if (!confirm('いまのデータをすべて置き換えます。よろしいですか?')) return;
    replaceAll(parsed);
    alert('読み込みました');
  } catch (e) {
    alert('読み込めませんでした: ' + e);
  }
}

export function Settings() {
  const data = useData();
  const setThreshold = (t: number) =>
    update((d) => {
      d.threshold = Math.min(20, Math.max(2, t));
    });

  return (
    <main class="screen">
      <h1 class="screen-title">設定</h1>

      <section class="card stack">
        <div class="field-label">アクションラインのしきい値</div>
        <p class="muted small">やりたさ×やりやすさ がこの値以上なら「できる側」。目安です。</p>
        <div class="stepper">
          <button class="btn" onClick={() => setThreshold(data.threshold - 1)} aria-label="下げる">
            −
          </button>
          <span class="stepper-value">{data.threshold}</span>
          <button class="btn" onClick={() => setThreshold(data.threshold + 1)} aria-label="上げる">
            +
          </button>
        </div>
      </section>

      <section class="card stack">
        <div class="field-label">データ</div>
        <p class="muted small">
          行動 {data.actions.length}・レシピ {data.recipes.length}・記録 {data.logs.length}件。データはこの端末の中だけに保存されています。
        </p>
        <button class="btn primary big" onClick={exportJson}>
          JSONで書き出す
        </button>
        <label class="btn big file-btn">
          JSONを読み込む
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.currentTarget.files?.[0];
              if (f) importJson(f);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </section>
    </main>
  );
}
