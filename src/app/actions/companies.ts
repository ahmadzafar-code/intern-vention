"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";

const TILE_BGS = ["#1A1A18", "#26415E", "#7A1F2B", "#1F4D3A", "#4B3FA8", "#B5341F", "#16453A", "#3A2E1F"];
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// New companies go live immediately (APPROVED) — no review queue. We still record an
// (auto-approved) CompanyRequest as an audit trail of who added what. Returns the slug so the
// caller routes the user into the contribute form to add their story.
export async function requestCompany(input: {
  name: string;
  website: string;
  industry: string;
  note: string;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const user = await requireSession();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Enter a company name" };
  const slug = slugify(name);
  if (!slug) return { ok: false, error: "Enter a valid company name" };

  const existing = await prisma.company.findUnique({ where: { slug }, select: { status: true } });
  if (existing) {
    return { ok: false, error: "That company already exists — search for it instead." };
  }

  const domain = input.website.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || `${slug}.com`;
  try {
    await prisma.$transaction([
      prisma.company.create({ data: { slug, name, industry: input.industry, domain, bg: TILE_BGS[slug.length % TILE_BGS.length], status: "APPROVED", createdBy: user.id } }),
      prisma.companyRequest.create({ data: { name, slug, industry: input.industry, website: input.website.trim() || null, note: input.note.trim() || null, status: "APPROVED", reviewedAt: new Date(), userId: user.id } }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, error: "That company already exists." };
    throw e;
  }
  revalidatePath("/contribute");
  revalidatePath("/"); // new company shows in the directory immediately
  return { ok: true, slug };
}

export async function reviewCompanyRequest(id: string, decision: "approve" | "reject"): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const req = await prisma.companyRequest.findUnique({ where: { id }, select: { slug: true, name: true, userId: true, status: true } });
  if (!req) return { ok: false, error: "Not found" };
  if (req.status !== "PENDING") return { ok: false, error: "Already reviewed" };

  const newStatus = decision === "approve" ? "APPROVED" : "REJECTED";
  await prisma.$transaction([
    prisma.companyRequest.update({ where: { id }, data: { status: newStatus, reviewedAt: new Date() } }),
    prisma.company.update({ where: { slug: req.slug }, data: { status: newStatus } }),
    prisma.notification.create({
      data: {
        recipientId: req.userId,
        type: decision === "approve" ? "newcontrib" : "reply",
        title: decision === "approve" ? `${req.name} was approved` : `${req.name} wasn't approved`,
        body:
          decision === "approve"
            ? "Your company is live in the directory — your story is now public."
            : "Our team couldn't verify this company. Reach out if you think this is a mistake.",
        slug: decision === "approve" ? req.slug : null,
      },
    }),
  ]);
  revalidatePath("/admin/companies");
  revalidatePath("/");
  return { ok: true };
}
