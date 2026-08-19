'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { useFadeInSections } from '@/hooks/useFadeInSections';
import { ParallaxSilk } from './ParallaxSilk';
import { HeroPhoto } from './HeroPhoto';
import { PinnedVideoBackground } from './PinnedVideoBackground';

function FadeSection({
  children,
  className = '',
  delay,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`fade-in-section ${className}`}
      style={delay != null ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  useFadeInSections();

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-background font-body text-on-surface antialiased">
      <nav
        className={`fixed top-0 z-50 w-full backdrop-blur-md transition-all duration-300 ${
          navScrolled ? 'nav-scrolled' : 'nav-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
          <Logo className="h-10 w-auto" />
          <div className="hidden items-center gap-8 md:flex">
            {['features', 'how-it-works', 'artists', 'pricing'].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-label-md font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                {id === 'how-it-works' ? 'How it Works' : id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="hidden text-label-md font-medium text-on-surface transition-colors hover:text-primary md:inline-block"
            >
              Login
            </Link>
            <Link href="/sign-up" className="lime-btn-pill px-6 py-3 text-sm">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero — responsive. Desktop: full-bleed photo behind a left-aligned
            headline. Mobile: green wash behind the headline, with the photo as a
            full-width banner below (a wide landscape can't be a background on a
            tall phone screen without swallowing the text). */}
        <section className="relative flex flex-col overflow-hidden bg-gradient-to-b from-[#b9d97f] via-[#cfe4a3] to-[#eaf3d6] lg:min-h-[921px] lg:justify-center">
          {/* Desktop-only photo background — whole image, subjects small on the
              right, blurred fill behind it, scrim lifting the left for copy. */}
          <div className="hidden lg:block">
            <HeroPhoto src="/media/hero-band.jpg" />
          </div>
          {/* Dissolves the hero into the next section's background instead of a
              hard cut at the section boundary. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] hidden h-32 bg-gradient-to-b from-transparent to-surface-container-lowest sm:h-40 lg:block lg:h-56" />
          <div className="relative z-10 mx-auto w-full max-w-container-max px-margin-mobile pb-8 pt-28 sm:pt-32 md:px-margin-desktop lg:pb-12">
            <FadeSection className="flex max-w-2xl flex-col gap-6 sm:gap-8">
              <h1 className="font-headline text-headline-xl text-on-surface lg:text-[40px] lg:leading-[48px]">
                Book the perfect artist.
                <br />
                <span className="text-primary">In minutes, not days.</span>
              </h1>
              <p className="max-w-xl font-body text-body-lg text-on-surface-variant">
                Say goodbye to endless WhatsApp chats, missed calls, and contract chaos. LIME Event
                connects you with top Tunisian talent with verified contracts, secure booking, and
                real-time calendar sync.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore/artists" className="lime-btn-pill text-center">
                  Find Artists Now
                </Link>
                <Link href="/sign-up?role=artist" className="lime-btn-pill-outline text-center">
                  Join as an Artist
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-surface-variant pt-4">
                <MaterialIcon name="new_releases" size={18} className="text-primary" />
                <p className="text-label-sm text-on-surface-variant">
                  Now booking artists across the Grand Tunis area
                </p>
              </div>
            </FadeSection>
          </div>
          {/* Mobile-only photo banner — the whole image at natural proportions,
              so nobody gets zoomed or clipped on a phone. */}
          <div className="relative w-full lg:hidden">
            <Image
              src="/media/hero-band.jpg"
              alt="LIME artists performing"
              width={2752}
              height={1536}
              priority
              sizes="100vw"
              className="h-auto w-full object-cover"
            />
          </div>
        </section>

        {/* Features */}
        <section className="bg-surface-container-lowest py-16 sm:py-24" id="features">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <FadeSection className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-headline text-headline-lg text-on-surface">
                The old way is broken.
              </h2>
              <p className="font-body text-body-md text-on-surface-variant">
                Booking talent shouldn&apos;t feel like a negotiation marathon. We&apos;ve
                streamlined the entire process.
              </p>
            </FadeSection>
            <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
              <FadeSection className="rounded-4xl border border-error-container bg-error-container/20 p-8 transition-transform hover:-translate-y-1">
                <div className="mb-6 flex items-center gap-3 text-on-error-container">
                  <MaterialIcon name="cancel" size={32} />
                  <h3 className="font-headline text-headline-md">The Old Way</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Scattered communication across WhatsApp, emails, and calls.',
                    'No formal contracts or clear terms, leading to disputes.',
                    'Uncertainty about pricing and hidden fees.',
                    'Manual payments and chasing invoices.',
                    'Artists double-booking or showing up late.',
                    'No trusted reviews or verification for talent.',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <MaterialIcon name="close" className="mt-1 text-error" size={20} />
                      <span className="font-body text-body-md">{t}</span>
                    </li>
                  ))}
                </ul>
              </FadeSection>
              <FadeSection className="relative overflow-hidden rounded-4xl border-t-4 border-primary-container bg-custom-lime-light p-8 shadow-lg transition-transform hover:-translate-y-1">
                <div className="absolute right-0 top-0 -z-0 h-32 w-32 rounded-bl-full bg-primary-container/20" />
                <div className="relative z-10">
                  <div className="mb-6 flex items-center gap-3">
                    <MaterialIcon name="check_circle" filled size={32} className="text-primary-container" />
                    <h3 className="font-headline text-headline-md">The LIME Way</h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Centralized dashboard for all talent communications.',
                      'Automated, digital contracts generated instantly.',
                      'Transparent pricing upfront with no surprises.',
                      'Transparent, contract-backed payments for peace of mind.',
                      'Real-time calendar sync prevents double bookings.',
                      'Verified talent with authentic organizer reviews.',
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3">
                        <MaterialIcon name="done" className="mt-1 text-primary-container" size={20} />
                        <span className="font-body text-body-md font-medium">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeSection>
            </div>
          </div>
        </section>

        {/* How it works + Dual audience scroll over a pinned video background */}
        <PinnedVideoBackground>
        {/* How it works */}
        <section className="py-16 sm:py-24" id="how-it-works">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <FadeSection className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-headline text-headline-lg">How it works</h2>
              <p className="font-body text-body-md text-on-surface-variant">
                Four simple steps to a successful event.
              </p>
            </FadeSection>
            <div className="relative">
              <div className="absolute left-0 top-1/2 z-0 hidden w-full -translate-y-1/2 border-t-2 border-dotted border-primary-container md:block" />
              <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-4">
                {[
                  { n: 1, icon: 'content_paste', title: 'Create Brief', desc: 'Detail your event needs, budget, and timeline.' },
                  { n: 2, icon: 'my_location', title: 'Find Talent', desc: 'Browse verified artists or get matched instantly.' },
                  { n: 3, icon: 'draw', title: 'Sign & Pay', desc: 'Digital contracts and a clear, contract-backed payment process.' },
                  { n: 4, icon: 'music_note', title: 'Enjoy Event', desc: 'Sit back and watch the performance.' },
                ].map((step, i) => (
                  <FadeSection
                    key={step.n}
                    delay={i * 100}
                    className="relative rounded-2xl bg-surface-container-lowest p-6 text-center shadow-sm transition-transform hover:-translate-y-1"
                  >
                    <div className="absolute -right-2 -top-6 select-none font-headline text-[72px] font-bold text-primary-container/20">
                      {step.n}
                    </div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
                      <MaterialIcon name={step.icon} size={32} className="text-primary" />
                    </div>
                    <h3 className="mb-2 font-headline text-headline-md">{step.title}</h3>
                    <p className="font-body text-body-md text-on-surface-variant">{step.desc}</p>
                  </FadeSection>
                ))}
              </div>
            </div>
            <FadeSection className="mt-12 text-center">
              <Link href="/sign-up?role=organizer" className="lime-btn-pill inline-block">
                Start Your First Event
              </Link>
            </FadeSection>
          </div>
        </section>

        {/* Dual audience */}
        <section className="py-16 sm:py-24" id="artists">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <FadeSection className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-headline text-headline-lg">Built for both sides of the stage.</h2>
            </FadeSection>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <FadeSection className="rounded-4xl border border-surface-variant bg-white p-10 shadow-sm transition-transform hover:-translate-y-1">
                <MaterialIcon name="event_available" size={40} className="mb-6 text-primary" />
                <h3 className="mb-6 font-headline text-headline-lg">For Organizers</h3>
                <ul className="mb-8 space-y-4">
                  {['Access to verified artists', 'Instant availability checking', 'Transparent, contract-backed pricing'].map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <MaterialIcon name="check_circle" className="text-custom-lime" />
                      <span className="font-body text-body-md">{t}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up?role=organizer"
                  className="block w-full rounded-full bg-surface-container py-4 text-center text-label-md font-semibold transition-all hover:scale-[1.03] hover:bg-surface-variant"
                >
                  Find Talent
                </Link>
              </FadeSection>
              <FadeSection
                delay={100}
                className="rounded-4xl bg-custom-dark p-10 text-white shadow-xl transition-transform hover:-translate-y-1"
              >
                <MaterialIcon name="mic" size={40} className="mb-6 text-custom-lime" />
                <h3 className="mb-6 font-headline text-headline-lg text-white">For Artists</h3>
                <ul className="mb-8 space-y-4">
                  {['Payment terms locked in by contract', 'Professional digital contracts', 'Manage all bookings in one calendar'].map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <MaterialIcon name="check_circle" className="text-custom-lime" />
                      <span className="font-body text-body-md text-surface-variant">{t}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up?role=artist" className="lime-btn-pill block w-full text-center">
                  Apply as Artist
                </Link>
              </FadeSection>
            </div>
          </div>
        </section>
        </PinnedVideoBackground>

        {/* Pricing */}
        <section className="bg-surface-container-lowest py-16 sm:py-24" id="pricing">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <FadeSection className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-headline text-headline-lg">Simple, transparent pricing.</h2>
            </FadeSection>
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
              <FadeSection className="rounded-4xl border border-surface-variant bg-surface p-8 transition-transform hover:-translate-y-1">
                <h3 className="mb-2 font-headline text-headline-md">Artist</h3>
                <div className="mb-6 font-headline text-headline-xl">Free</div>
                <Link href="/sign-up?role=artist" className="block w-full rounded-full bg-surface-container py-3 text-center text-label-md transition-colors hover:bg-surface-variant">
                  Join Free
                </Link>
              </FadeSection>
              <FadeSection
                delay={100}
                className="relative z-10 rounded-4xl bg-on-primary-fixed p-8 shadow-xl md:scale-105"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-container px-4 py-1 text-label-sm uppercase tracking-wider text-on-primary-fixed">
                  Most Popular
                </div>
                <h3 className="mb-2 font-headline text-headline-md text-white">Organizer</h3>
                <div className="mb-6 font-headline text-headline-xl text-primary-container">
                  7% <span className="text-body-md font-normal text-surface-variant">fee</span>
                </div>
                <Link href="/sign-up?role=organizer" className="lime-btn-pill block w-full text-center">
                  Start Booking
                </Link>
              </FadeSection>
              <FadeSection delay={200} className="rounded-4xl border border-surface-variant bg-surface p-8 opacity-75">
                <h3 className="mb-2 font-headline text-headline-md text-on-surface-variant">Agencies</h3>
                <div className="mb-6 font-headline text-headline-xl text-on-surface-variant">Custom</div>
                <Link href="/sign-up?role=agency" className="block w-full rounded-full bg-surface-container py-3 text-center text-label-md">
                  Contact Sales
                </Link>
              </FadeSection>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <FadeSection className="relative overflow-hidden bg-primary-container py-16 sm:py-24">
          {/* Subtle reprise of the hero silk, tinted back into the lime band so
              the centered text stays legible. */}
          <ParallaxSilk
            opacity={0.28}
            speed={0.18}
            objectPosition="center center"
            scrimClassName="bg-primary-container/50"
          />
          <div className="relative z-10 mx-auto max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
            <h2 className="mb-8 font-headline text-[40px] font-black leading-tight text-on-primary-fixed md:text-[48px]">
              Your next event deserves the best talent.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/explore/artists"
                className="rounded-full bg-on-primary-fixed px-8 py-4 text-label-md font-semibold text-white transition-all hover:scale-[1.03] hover:shadow-lg"
              >
                Find Artists Now
              </Link>
              <Link
                href="/sign-up?role=artist"
                className="rounded-full border-2 border-on-primary-fixed px-8 py-4 text-label-md font-semibold text-on-primary-fixed transition-all hover:scale-[1.03] hover:bg-on-primary-fixed hover:text-white"
              >
                Join as an Artist
              </Link>
            </div>
          </div>
        </FadeSection>
      </main>

      <footer className="w-full bg-custom-dark pb-8 pt-16 text-white">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <Image src="/logo.png" alt="LIME" width={366} height={160} className="mb-6 h-10 w-auto brightness-0 invert" />
              <p className="font-body text-body-md text-surface-variant">Zesty Professionalism.</p>
            </div>
            {[
              { title: 'Platform', links: ['#how-it-works', '#pricing', '#'] },
              { title: 'For Artists', links: ['/sign-up?role=artist', '#'] },
              { title: 'Company', links: ['#', '#', '#'] },
            ].map((col, idx) => (
              <div key={col.title}>
                <h4 className="mb-4 font-bold">{col.title}</h4>
                <ul>
                  {col.links.map((href, i) => (
                    <li key={i}>
                      {/* py-2.5 keeps the tappable area near 44px without changing
                          the visible line height, since space-y-2 alone left each
                          link at a ~21px hit target. */}
                      <Link
                        href={href}
                        className="inline-block py-2.5 font-body text-body-md text-surface-variant transition-colors hover:text-custom-lime"
                      >
                        {idx === 0 && i === 0 ? 'How it Works' : idx === 0 && i === 1 ? 'Pricing' : 'Learn more'}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="font-body text-body-md text-surface-variant">© 2024 LIME Event. All rights reserved.</p>
            <p className="font-body text-body-md text-surface-variant">Made with 💚 in Tunisia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
