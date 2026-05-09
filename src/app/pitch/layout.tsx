/**
 * Pitch layout: releases the SaaS-shell body overflow so the long
 * editorial pitch pages can scroll naturally. The dashboard layout
 * (in /(app)) keeps its full-bleed fixed shell.
 */
export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          height: auto !important;
          overflow: auto !important;
        }
      `}</style>
      {children}
    </>
  );
}
