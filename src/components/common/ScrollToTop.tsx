"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If you want it to trigger also when query string changes:
    // (e.g. /ideas?page=2)
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    // scroll the document (not a div)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, searchParams]);

  return null;
}
