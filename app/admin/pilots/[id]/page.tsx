import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { PilotDetailPanel } from "@/components/admin/PilotDetailPanel";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import { mContainer, mSection } from "@/lib/marketing-layout";

export const metadata = {
  title: "Pilot detail",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminPilotDetailPage({ params }: Props) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    if (auth.status === 401) redirect("/auth/sign-in?next=/admin/pilots");
    return (
      <>
        <Header />
        <main className="flex-1">
          <section className={`${mSection} pb-16`}>
            <div className={mContainer}>
              <h1 className="text-3xl font-bold">Access denied</h1>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const { id } = await params;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <div className="mb-8">
              <AdminNav active="pilots" />
            </div>
            <PilotDetailPanel pilotId={id} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
