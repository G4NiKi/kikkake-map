import type { ComponentChildren } from 'preact';

interface Props {
  title?: string;
  onClose?: () => void;
  children: ComponentChildren;
}

// 画面下から出るシート。片手で操作しやすいよう、内容は画面の下半分に置く
export function Sheet({ title, onClose, children }: Props) {
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
        {title && <h2 class="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
