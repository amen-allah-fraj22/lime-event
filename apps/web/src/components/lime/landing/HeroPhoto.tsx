import Image from 'next/image';

/**
 * Hero photo background that shows the WHOLE image (object-contain) so the
 * subjects stay at their natural, smaller scale instead of being zoomed in by
 * object-cover on a tall hero. A blurred, zoomed copy sits underneath to fill
 * the letterbox/pillarbox area with matching colour, so there's no hard seam.
 * The sharp copy is anchored right (subjects on the right); the headline sits
 * over the calmer left, lifted by the scrim.
 */
export function HeroPhoto({
  src,
  scrimClassName = 'bg-gradient-to-r from-surface/70 via-surface/20 to-transparent',
}: {
  src: string;
  scrimClassName?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Blurred fill — seamless colour behind the contained image. */}
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-125 object-cover blur-2xl"
      />
      {/* Sharp, whole image — subjects at natural (smaller) scale, on the right. */}
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-contain object-right"
      />
      <div className={`absolute inset-0 ${scrimClassName}`} />
    </div>
  );
}
