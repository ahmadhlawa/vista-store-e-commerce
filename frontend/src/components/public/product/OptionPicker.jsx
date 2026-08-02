/**
 * Variant chooser. Every variant is a real row from the API, so the label is the
 * variant title rather than a synthesised combination, and an inactive variant
 * stays visible but unselectable instead of vanishing.
 */
export default function OptionPicker({ product, variants, variantId, onPick, error }) {
  if (!variants.length) return null;
  const groupName = product?.options?.[0]?.name || "الخيار";
  const errorId = error ? "vs-option-error" : undefined;

  return (
    <fieldset className="vs-options" aria-describedby={errorId}>
      <legend className="vs-options__legend">
        {groupName}
        <span className="vs-options__required" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="vs-options__row">
        {variants.map((variant) => {
          const out = variant.stock_quantity <= 0;
          return (
            <button
              key={variant.id}
              type="button"
              className="vs-option"
              aria-pressed={variant.id === variantId}
              data-out={out}
              onClick={() => onPick(variant.id)}
            >
              {variant.title}
              {out && <span className="vs-option__out"> — نفد</span>}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="vs-options__error" id="vs-option-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
