"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { suppliers, priceTier, supplierKind } from "@/lib/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";

const SUPPLIER_KINDS = supplierKind.enumValues;
const PRICE_TIERS = priceTier.enumValues;

type Result =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function parseAmenities(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parsePct(raw: string): string | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 1) return null;
  return n.toFixed(4);
}

export async function createSupplierAction(
  formData: FormData,
): Promise<Result> {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const kindRaw = String(formData.get("kind") ?? "");
    if (!name) return { ok: false, error: "Name is required" };
    if (!SUPPLIER_KINDS.includes(kindRaw as (typeof SUPPLIER_KINDS)[number])) {
      return { ok: false, error: `Unknown kind: ${kindRaw}` };
    }
    const tierRaw = String(formData.get("priceTier") ?? "");
    const priceTier = PRICE_TIERS.includes(
      tierRaw as (typeof PRICE_TIERS)[number],
    )
      ? (tierRaw as (typeof PRICE_TIERS)[number])
      : null;

    const commissionRaw = String(formData.get("commissionPct") ?? "").trim();

    const [row] = await db
      .insert(suppliers)
      .values({
        name,
        kind: kindRaw as (typeof SUPPLIER_KINDS)[number],
        city: String(formData.get("city") ?? "").trim() || null,
        country: String(formData.get("country") ?? "").trim() || null,
        region: String(formData.get("region") ?? "").trim() || null,
        priceTier,
        amenities: parseAmenities(String(formData.get("amenities") ?? "")),
        notes: String(formData.get("notes") ?? "").trim() || null,
        preferred: formData.get("preferred") === "on",
        virtuoso: formData.get("virtuoso") === "on",
        commissionPct: commissionRaw ? parsePct(commissionRaw) : null,
        contact: String(formData.get("contact") ?? "").trim() || null,
        website: String(formData.get("website") ?? "").trim() || null,
      })
      .returning({ id: suppliers.id });

    revalidatePath("/admin/suppliers");
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: authError(err, "create failed") };
  }
}

export async function updateSupplierAction(
  id: string,
  formData: FormData,
): Promise<Result> {
  if (!id) return { ok: false, error: "id required" };
  try {
    await requireAdmin();
    const tierRaw = String(formData.get("priceTier") ?? "");
    const priceTier = PRICE_TIERS.includes(
      tierRaw as (typeof PRICE_TIERS)[number],
    )
      ? (tierRaw as (typeof PRICE_TIERS)[number])
      : null;
    const commissionRaw = String(formData.get("commissionPct") ?? "").trim();

    await db
      .update(suppliers)
      .set({
        name: String(formData.get("name") ?? "").trim(),
        kind: String(
          formData.get("kind") ?? "other",
        ) as (typeof SUPPLIER_KINDS)[number],
        city: String(formData.get("city") ?? "").trim() || null,
        country: String(formData.get("country") ?? "").trim() || null,
        region: String(formData.get("region") ?? "").trim() || null,
        priceTier,
        amenities: parseAmenities(String(formData.get("amenities") ?? "")),
        notes: String(formData.get("notes") ?? "").trim() || null,
        preferred: formData.get("preferred") === "on",
        virtuoso: formData.get("virtuoso") === "on",
        commissionPct: commissionRaw ? parsePct(commissionRaw) : null,
        contact: String(formData.get("contact") ?? "").trim() || null,
        website: String(formData.get("website") ?? "").trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id));

    revalidatePath("/admin/suppliers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "update failed") };
  }
}

export async function deleteSupplierAction(id: string): Promise<Result> {
  if (!id) return { ok: false, error: "id required" };
  try {
    await requireAdmin();
    await db.delete(suppliers).where(eq(suppliers.id, id));
    revalidatePath("/admin/suppliers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "delete failed") };
  }
}

export async function toggleSupplierFlagAction(
  id: string,
  flag: "preferred" | "virtuoso",
  value: boolean,
): Promise<Result> {
  if (!id) return { ok: false, error: "id required" };
  try {
    await requireAdmin();
    await db
      .update(suppliers)
      .set({ [flag]: value, updatedAt: new Date() })
      .where(eq(suppliers.id, id));
    revalidatePath("/admin/suppliers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "toggle failed") };
  }
}
