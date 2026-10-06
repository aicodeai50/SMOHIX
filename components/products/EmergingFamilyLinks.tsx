import Link from "next/link";
import { FAMILY_PROJECTS } from "@/lib/family-projects";
import { mFocusRing } from "@/lib/marketing-layout";

export function EmergingFamilyLinks() {
  return <nav aria-label="Emerging Smohix family projects" className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
    <span className="text-muted">Also in the family</span>
    {FAMILY_PROJECTS.map((project) => <Link key={project.id} href={`/family/${project.slug}`} className={`text-accent hover:underline ${mFocusRing}`}>{project.name} · {project.status === "planned" ? "Planned" : "Prototype"} →</Link>)}
  </nav>;
}
