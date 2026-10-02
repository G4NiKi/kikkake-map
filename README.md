# kikkake-map

習慣化アプリの PoC(仕様は [SPEC.md](SPEC.md))。Vite + Preact + TypeScript の静的 Web アプリで、データは端末内の IndexedDB に保存する。

## 開発

```sh
npm install
npm run dev      # http://localhost:5173/kikkake-map/
npm run build
```

## 公開(GitHub Pages)

1. リポジトリの Settings → Pages → Source を「GitHub Actions」にする
2. 合言葉を決めてハッシュを作る:`npm run hash -- <合言葉>`
3. Settings → Secrets and variables → Actions に `PASSCODE_HASH` という名前でハッシュを登録する
4. `main` に push すると `.github/workflows/deploy.yml` がビルドして公開する
5. iPhone の Safari で `https://g4niki.github.io/kikkake-map/` を開き、合言葉を入れてから「ホーム画面に追加」する

### 「公開しない」ための仕組みと限界

- `noindex` と `robots.txt` で検索エンジンに載らないようにしている
- `PASSCODE_HASH` を登録すると、初回に合言葉画面が出る(端末ごとに一度入れれば以後は出ない)
- 静的サイトなので本当の認証ではない。配信される JS は誰でも取得でき、合言葉が短いとハッシュから推測される。長めの合言葉にすること
- 記録データはサーバーに置かず各端末の中だけにあるため、他人が URL を開いても見えるのは空のアプリだけ

## データ

- 設定画面から全データを JSON で書き出し・読み込みできる
- `events` に縮小ループの提案・縮小・アンカー変更・マップ閲覧などを時刻つきで残しているので、2週間後の検証はこの JSON から数える
