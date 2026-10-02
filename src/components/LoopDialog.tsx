import { useEffect, useState } from 'preact/hooks';
import { changeAnchor, replaceAction, resetLoop } from '../logic';
import { addEvent, getData, update } from '../store';
import type { Recipe } from '../types';
import { AnchorInput } from './AnchorInput';
import { ResizeForm } from './ResizeForm';
import { Sheet } from './Sheet';

interface Props {
  recipe: Recipe;
  mode: 'shrink' | 'grow';
  onClose: () => void;
}

type Step = 'choose' | 'resize' | 'anchor';

// 縮小ループ:未達が2回続いたとき(または5回連続で達成したとき)の提案
export function LoopDialog({ recipe, mode, onClose }: Props) {
  const [step, setStep] = useState<Step>('choose');
  const [anchor, setAnchor] = useState(recipe.anchor);
  const actions = recipe.actionIds
    .map((id) => getData().actions.find((a) => a.id === id))
    .filter((a) => !!a);

  useEffect(() => {
    update((d) => addEvent(d, { type: mode === 'shrink' ? 'shrink_prompted' : 'grow_prompted', recipeId: recipe.id }));
  }, []);

  const keep = () => {
    update((d) => {
      addEvent(d, { type: 'kept', recipeId: recipe.id });
      resetLoop(d, recipe.id);
    });
    onClose();
  };

  const shrink = mode === 'shrink';

  return (
    <Sheet title={shrink ? '2回続けてできませんでした' : '5回続けてできました'} onClose={keep}>
      {step === 'choose' && (
        <div class="stack">
          <p class="muted">
            {shrink
              ? '意志が弱いのではなく、行動が大きすぎるか、きっかけが合っていないのかもしれません。'
              : '行動を少し大きくしてみますか?'}
          </p>
          <button class="btn primary big" onClick={() => setStep('resize')}>
            {shrink ? '行動をもっと小さくする' : '少し大きくする'}
          </button>
          {shrink && (
            <button class="btn big" onClick={() => setStep('anchor')}>
              アンカーを変える
            </button>
          )}
          <button class="btn ghost big" onClick={keep}>
            {shrink ? '今回はそのまま続ける' : 'このまま続ける'}
          </button>
        </div>
      )}
      {step === 'resize' && (
        <ResizeForm
          actions={actions}
          direction={mode}
          onCancel={() => setStep('choose')}
          onSubmit={(oldId, next) => {
            update((d) => {
              const created = replaceAction(d, oldId, next);
              addEvent(d, {
                type: shrink ? 'shrunk' : 'grown',
                recipeId: recipe.id,
                actionId: created.id,
                source: 'loop',
              });
              resetLoop(d, recipe.id);
            });
            onClose();
          }}
        />
      )}
      {step === 'anchor' && (
        <form
          class="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!anchor.trim()) return;
            update((d) => {
              changeAnchor(d, recipe.id, anchor.trim(), 'loop');
              resetLoop(d, recipe.id);
            });
            onClose();
          }}
        >
          <p class="muted">いまのアンカー:{recipe.anchor}</p>
          <AnchorInput value={anchor} onInput={setAnchor} />
          <div class="row">
            <button type="button" class="btn ghost" onClick={() => setStep('choose')}>
              戻る
            </button>
            <button type="submit" class="btn primary" disabled={!anchor.trim() || anchor.trim() === recipe.anchor}>
              変える
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
