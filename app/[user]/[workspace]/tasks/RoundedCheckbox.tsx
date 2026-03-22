"use client";

import * as React from "react";

type RoundedCheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
  stopPropagation?: boolean;
  className?: string;
};

export function RoundedCheckbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  ariaLabel,
  disabled,
  stopPropagation,
  className,
}: RoundedCheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const stop = React.useCallback(
    (e: React.SyntheticEvent) => {
      if (stopPropagation) e.stopPropagation();
    },
    [stopPropagation],
  );

  React.useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.indeterminate = indeterminate && !checked;
  }, [checked, indeterminate]);

  return (
    <label
      className={
        "inline-flex items-center justify-center select-none" +
        (className ? ` ${className}` : "")
      }
      onClick={stop}
      onMouseDown={stop}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        aria-label={ariaLabel}
        disabled={disabled}
        className="sr-only peer"
      />
      <span
        className={
          "flex h-5 w-5 items-center justify-center rounded-lg border border-(--ws-border) bg-(--ws-surface-2) " +
          "transition-colors " +
          "peer-checked:bg-(--ws-checkbox-bg) peer-checked:border-(--ws-checkbox-border) " +
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-(--ws-border) " +
          "peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-(--ws-bg) " +
          "peer-disabled:opacity-50"
        }
      >
        <span
          className={
            checked
              ? "h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-(--ws-checkbox-check) mb-0.5"
              : indeterminate
                ? "h-0.5 w-2.5 rounded bg-(--ws-checkbox-check)"
                : "hidden"
          }
        />
      </span>
    </label>
  );
}
