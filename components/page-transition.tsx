"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div
      className={`page-transition ${isAnimating ? "page-transition-exit" : "page-transition-enter"}`}
    >
      {displayChildren}
    </div>
  );
}