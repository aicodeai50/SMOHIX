import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { PilotsAdminPanel } from "@/components/admin/PilotsAdminPanel";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { requirePlatformAdmin } from "@/lib/platform/admin";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";

export const metadata = {
  title: "Pilot management",
  robots: { index: false, follow: false },
};

export default async function AdminPilotsPage() {
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

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Internal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Pilot management
            </h1>
            <p className={`mt-3 max-w-2xl ${mBody}`}>
              Track pilot engagements from proposal through completion. Pilots are created from
              qualified leads — never automatically.
            </p>
            <div className="mt-8">
              <AdminNav active="pilots" />
            </div>
            <div className="mt-10">
              <PilotsAdminPanel />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
