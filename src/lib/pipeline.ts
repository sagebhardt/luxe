/**
 * Shared pipeline types + constants. NO server-only import — these are
 * referenced from both server queries and client components.
 */

import type { lifecycleStage } from "@/lib/db/schema";

export type Stage = (typeof lifecycleStage.enumValues)[number];

export const STAGES: Stage[] = [
  "lead",
  "discovery",
  "proposing",
  "booked",
  "traveling",
  "returning",
  "dormant",
];

export const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  discovery: "Discovery",
  proposing: "Proposing",
  booked: "Booked",
  traveling: "Traveling",
  returning: "Returning",
  dormant: "Dormant",
};

export type PipelineCard = {
  id: string;
  name: string;
  initial: string;
  avatarColor: string | null;
  tag: string;
  stage: Stage;
  lifetimeValueCents: number;
  currentDealCents: number | null;
  currentDealName: string | null;
  currentDealStatus: string | null;
};
