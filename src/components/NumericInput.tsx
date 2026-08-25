"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode"> & {
  /** Permite punto decimal en el teclado (por defecto solo enteros). */
  decimal?: boolean;
};

/** Campo numérico con teclado numérico en móvil. */
export const NumericInput = forwardRef<HTMLInputElement, Props>(function NumericInput(
  { decimal = false, className = "input", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      pattern={decimal ? undefined : "[0-9]*"}
      enterKeyHint="done"
      autoComplete="off"
      className={className}
      {...props}
    />
  );
});
