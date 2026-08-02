import { useCallback, useEffect, useRef, useState } from "react";

// Shared "add to cart" affordance for the product and package cards. The cards
// keep their own dimensions and colours (passed in as `style`); everything the
// interaction needs — hover lift, press scale, the success window and the
// double-click guard — lives here so the two cards cannot drift apart.
export const ADDED_LABEL = "تمت الإضافة ✓";
export const SUCCESS_MS = 1000;

/** Fires `onAdd` once, then holds a success flag for SUCCESS_MS. */
export function useAddToCartFeedback(onAdd) {
  const [added, setAdded] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const fire = useCallback(() => {
    // While the success state is showing, further activations are swallowed:
    // one click (or Enter/Space) must never add two lines.
    if (added) return;
    onAdd?.();
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), SUCCESS_MS);
  }, [added, onAdd]);

  return { added, fire };
}

export default function AddToCartButton({ onAdd, label, icon, disabled = false, style }) {
  const { added, fire } = useAddToCartFeedback(onAdd);
  return (
    <button
      type="button"
      onClick={fire}
      disabled={disabled}
      aria-live="polite"
      className={added ? "atc-btn is-added" : "atc-btn"}
      style={style}
    >
      {added ? (
        ADDED_LABEL
      ) : (
        <>
          {icon ? <span style={{ fontSize: "15px" }}>{icon}</span> : null}
          {label}
        </>
      )}
    </button>
  );
}
