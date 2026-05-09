"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CrmSearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params?.toString() ?? "");
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("id");
      router.replace(`/clients?${next.toString()}`);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      className="search-box"
      placeholder="Search clients…"
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
