import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  className?: string;
  showTagline?: boolean;
};

export function Logo({ className = 'h-10 w-auto', showTagline = false }: LogoProps) {
  return (
    <Link href="/" className="flex flex-col items-start gap-0.5">
      <Image
        src="/logo.jpeg"
        alt="lime — Fresh bookings, Fresh talent."
        width={160}
        height={48}
        className={className}
        priority
      />
      {showTagline && (
        <span className="text-xs text-brand-accent">
          Fresh bookings, Fresh talent.
        </span>
      )}
    </Link>
  );
}
