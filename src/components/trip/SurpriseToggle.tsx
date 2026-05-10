"use client";

import { useState, useTransition } from "react";
import { setBookingSurpriseAction } from "@/app/(app)/trip/booking-actions";

export function SurpriseToggle({
  bookingId,
  initial,
}: {
  bookingId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await setBookingSurpriseAction(bookingId, next);
      if (!res.ok) setOn(!next);
    });
  };

  return (
    <label
      className={`surprise-toggle${on ? " is-on" : ""}`}
      title="Hide from client until day-of, then reveal with a 'small touch' label"
    >
      <input
        type="checkbox"
        checked={on}
        onChange={toggle}
        disabled={pending}
      />
      <span>Surprise</span>
    </label>
  );
}
