import Image from 'next/image';

/**
 * Desktop hero photo background. Plain object-cover anchored right so the
 * subjects sit on the right and the calm green fills the left under the
 * headline — no blurred filler strips. A soft left scrim lifts the copy.
 */
export function HeroPhoto({
  src,
  scrimClassName = 'bg-gradient-to-r from-surface/45 via-surface/5 to-transparent',
}: {
  src: string;
  scrimClassName?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      <div className={`absolute inset-0 ${scrimClassName}`} />
    </div>
  );
}
