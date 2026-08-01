import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { LeadsPipelinePanel } from "@/components/admin/LeadsPipelinePanel";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";

export const metadata = {
  title: "Lead administration",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function AdminLeadsPage({ searchParams }: Props) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    if (auth.status === 401) redirect("/auth/sign-in?next=/admin/leads");
    return (
      <>
        <Header />
        <main className="flex-1">
          <section className={`${mSection} pb-16`}>
            <div className={mContainer}>
              <h1 className="text-3xl font-bold">Access denied</h1>
              <Link href="/" className="mt-4 inline-block text-accent hover:underline">
                Return home
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const { ref } = await searchParams;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Internal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Lead pipeline
            </h1>
            <p className={`mt-3 max-w-2xl ${mBody}`}>
              Review enquiries, assign owners, schedule follow-ups, and convert qualified leads to
              pilots.
            </p>
            <div className="mt-8">
              <AdminNav active="leads" />
            </div>
            <div className="mt-10">
              <LeadsPipelinePanel highlightRef={ref ?? null} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
