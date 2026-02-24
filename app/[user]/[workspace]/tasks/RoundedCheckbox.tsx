"use client";

import * as React from "react";

type RoundedCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
  stopPropagation?: boolean;
  className?: string;
};

export function RoundedCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
  disabled,
  stopPropagation,
  className,
}: RoundedCheckboxProps) {
  const stop = React.useCallback(
    (e: React.SyntheticEvent) => {
      if (stopPropagation) e.stopPropagation();
    },
    [stopPropagation],
  );

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
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        aria-label={ariaLabel}
        disabled={disabled}
        className="sr-only peer"
      />
      <span
        className={
          "flex h-5 w-5 items-center justify-center rounded-lg border border-[color:var(--ws-border)] bg-[color:var(--ws-surface-2)] " +
          "transition-colors " +
          "peer-checked:bg-[color:var(--ws-checkbox-bg)] peer-checked:border-[color:var(--ws-checkbox-border)] " +
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--ws-border)] " +
          "peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[color:var(--ws-bg)] " +
          "peer-disabled:opacity-50"
        }
      >
        <span
          className={
            checked
              ? "h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-[color:var(--ws-checkbox-check)] mb-0.5"
              : "hidden"
          }
        />
      </span>
    </label>
  );
}
