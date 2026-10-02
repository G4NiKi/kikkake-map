import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

// 簡易的な合言葉画面。ビルド時に VITE_PASSCODE_HASH(SHA-256)が渡されたときだけ有効になる。
// 静的サイトなので本当の認証ではなく、URL を知った他人が気軽に使えないようにする目隠し。
const HASH = (import.meta.env.VITE_PASSCODE_HASH as string | undefined)?.trim().toLowerCase();
const STORAGE_KEY = 'kikkake-map:unlocked';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function isUnlocked(): boolean {
  if (!HASH) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === HASH;
  } catch {
    return false;
  }
}

export function Gate({ children }: { children: ComponentChildren }) {
  const [ok, setOk] = useState(isUnlocked);
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  if (ok) return <>{children}</>;

  return (
    <main class="gate">
      <form
        class="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if ((await sha256(pass)) === HASH) {
            try {
              localStorage.setItem(STORAGE_KEY, HASH!);
            } catch {
              // 保存できなくても今回のセッションは開く
            }
            setOk(true);
          } else {
            setError(true);
          }
        }}
      >
        <h1>きっかけマップ</h1>
        <label class="field">
          <span class="field-label">合言葉</span>
          <input
            type="password"
            value={pass}
            autoComplete="current-password"
            onInput={(e) => {
              setPass(e.currentTarget.value);
              setError(false);
            }}
          />
        </label>
        {error && <span class="hint">合言葉が違います</span>}
        <button class="btn primary big" type="submit">
          開く
        </button>
      </form>
    </main>
  );
}
