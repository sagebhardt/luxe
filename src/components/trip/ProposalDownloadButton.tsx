"use client";

export function ProposalDownloadButton({ tripId }: { tripId: string }) {
  const url = `/api/trip/${tripId}/proposal.pdf`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="proposal-btn"
      title="Open proposal PDF in a new tab"
    >
      Proposal PDF
    </a>
  );
}
