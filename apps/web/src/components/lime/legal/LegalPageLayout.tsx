import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function LegalPageLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop md:py-16">
        <Logo className="mb-8 h-9 w-auto" />
        <Link
          href="/"
          className="mb-8 inline-block font-body text-label-md text-secondary transition-colors hover:text-primary"
        >
          ← Back to home
        </Link>
        <h1 className="mb-2 font-headline text-headline-lg text-on-surface">{title}</h1>
        <p className="mb-10 font-body text-label-sm text-secondary">Last updated: {updated}</p>
        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 font-headline text-headline-md text-on-surface">{heading}</h2>
      <div className="flex flex-col gap-3 font-body text-body-md text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}
