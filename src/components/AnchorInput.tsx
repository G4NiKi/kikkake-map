import { isVagueAnchor } from '../logic';

interface Props {
  value: string;
  onInput: (v: string) => void;
}

export function AnchorInput({ value, onInput }: Props) {
  return (
    <label class="field">
      <span class="field-label">アンカー(〜したら)</span>
      <input
        type="text"
        value={value}
        placeholder="例:帰宅してバッグを床に置いた直後"
        onInput={(e) => onInput(e.currentTarget.value)}
      />
      {isVagueAnchor(value) && <span class="hint">もっと具体的な瞬間にしませんか?</span>}
    </label>
  );
}
