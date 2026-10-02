// 合言葉の SHA-256 ハッシュを出力する。GitHub Secrets の PASSCODE_HASH に登録して使う。
// 使い方: npm run hash -- <合言葉>
import { createHash } from 'node:crypto';

const pass = process.argv[2];
if (!pass) {
  console.error('使い方: npm run hash -- <合言葉>');
  process.exit(1);
}
console.log(createHash('sha256').update(pass, 'utf8').digest('hex'));
