import { cn } from '@/lib/utils';

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
};

export function MaterialIcon({ name, className, filled, size = 24 }: MaterialIconProps) {
  return (
    <span
      className={cn('material-symbols-outlined leading-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined,
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
