"use client";

import * as React from "react";

export function useWsPortalContainer() {
  const [container, setContainer] = React.useState<Element | null>(() => {
    if (typeof window === "undefined") return null;
    return document.querySelector(".ws-theme");
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setContainer(document.querySelector(".ws-theme"));
  }, []);

  return container;
}
