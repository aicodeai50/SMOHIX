import Link from 'next/link';
export function VerifiedFoundations() {
  return <section aria-labelledby="foundation-heading" className="border-y border-border py-12">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Engineering foundations</p>
      <h2 id="foundation-heading" className="mt-3 text-2xl font-semibold">Built on documented technology.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Explore our architecture, integration reference, and trust documentation. These are technologies used in Smohix’s stack, rather than customer endorsements.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Smohix technology stack">{['Next.js','React','Supabase','Railway'].map(name=><li key={name} className="rounded-xl border border-border bg-surface/60 px-5 py-4 text-lg font-semibold">{name}</li>)}</ul>
      <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold text-accent"><Link href="/technology">Technology stack →</Link><Link href="/trust">Trust documentation →</Link><Link href="/status">Check service status →</Link></div>
    </div>
  </section>;
}
