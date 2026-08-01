import { listRecentLeadActivity } from "./activity";
import { listExtendedLeads } from "./leads";
import { listPilots } from "./pilots";

export type RevOpsDashboard = {
  newLeadsCount: number;
  overdueFollowUpsCount: number;
  pilotsAwaitingActionCount: number;
  activePilotsCount: number;
  conversionCounts: {
    total: number;
    qualified: number;
    pilotProposed: number;
    pilotActive: number;
    won: number;
    closed: number;
    spam: number;
  };
  leadsBySource: { source: string; count: number }[];
  leadsByInquiryType: { inquiryType: string; count: number }[];
  recentActivity: {
    id: string;
    leadId: string;
    createdAt: string;
    eventType: string;
    summary: string;
    actorEmail: string;
  }[];
};

async function countLeadsByStatus(): Promise<RevOpsDashboard["conversionCounts"] & { rows: unknown[] }> {
  const { rows, total } = await listExtendedLeads({ page: 1, limit: 5000 });
  const counts = {
    total,
    qualified: 0,
    pilotProposed: 0,
    pilotActive: 0,
    won: 0,
    closed: 0,
    spam: 0,
  };
  for (const row of rows) {
    if (row.status === "qualified") counts.qualified += 1;
    if (row.status === "pilot_proposed") counts.pilotProposed += 1;
    if (row.status === "pilot_active") counts.pilotActive += 1;
    if (row.status === "won") counts.won += 1;
    if (row.status === "closed") counts.closed += 1;
    if (row.status === "spam") counts.spam += 1;
  }
  return { ...counts, rows };
}

export async function loadRevOpsDashboard(): Promise<RevOpsDashboard> {
  const now = Date.now();

  const [{ rows: newLeads }, { rows: overdue }, { rows: draftPilots }, { rows: proposedPilots }, { rows: activePilots }, conversion, activity] =
    await Promise.all([
      listExtendedLeads({ page: 1, limit: 5000, status: "new" }),
      listExtendedLeads({ page: 1, limit: 5000, overdueFollowUp: true }),
      listPilots({ page: 1, limit: 5000, status: "draft" }),
      listPilots({ page: 1, limit: 5000, status: "proposed" }),
      listPilots({ page: 1, limit: 5000, status: "active" }),
      countLeadsByStatus(),
      listRecentLeadActivity(15),
    ]);

  const { rows: allLeads } = await listExtendedLeads({ page: 1, limit: 5000 });

  const sourceMap = new Map<string, number>();
  const inquiryMap = new Map<string, number>();
  for (const lead of allLeads) {
    const source = lead.source_label ?? lead.source_path ?? "unknown";
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
    inquiryMap.set(lead.inquiry_type, (inquiryMap.get(lead.inquiry_type) ?? 0) + 1);
  }

  return {
    newLeadsCount: newLeads.length,
    overdueFollowUpsCount: overdue.filter(
      (l) => l.follow_up_date && new Date(l.follow_up_date).getTime() < now,
    ).length,
    pilotsAwaitingActionCount: draftPilots.length + proposedPilots.length,
    activePilotsCount: activePilots.length,
    conversionCounts: {
      total: conversion.total,
      qualified: conversion.qualified,
      pilotProposed: conversion.pilotProposed,
      pilotActive: conversion.pilotActive,
      won: conversion.won,
      closed: conversion.closed,
      spam: conversion.spam,
    },
    leadsBySource: [...sourceMap.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    leadsByInquiryType: [...inquiryMap.entries()]
      .map(([inquiryType, count]) => ({ inquiryType, count }))
      .sort((a, b) => b.count - a.count),
    recentActivity: activity.map((a) => ({
      id: a.id,
      leadId: a.lead_id,
      createdAt: a.created_at,
      eventType: a.event_type,
      summary: a.summary,
      actorEmail: a.actor_email,
    })),
  };
}
