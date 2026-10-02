interface Props {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  optional?: boolean; // true なら同じ値をもう一度押すと未入力に戻る
}

export function Scale({ label, value, onChange, optional }: Props) {
  return (
    <div class="scale">
      <div class="scale-label">{label}</div>
      <div class="scale-row" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            role="radio"
            aria-checked={value === n}
            class={value === n ? 'scale-btn on' : 'scale-btn'}
            onClick={() => onChange(optional && value === n ? undefined : n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
