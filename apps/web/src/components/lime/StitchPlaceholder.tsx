type StitchPlaceholderProps = {
  name: string;
  description: string;
};

/** Shown until Stitch-generated components are dropped into `components/lime/` */
export function StitchPlaceholder({ name, description }: StitchPlaceholderProps) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-dashed border-lime bg-lime/10 p-8 text-center">
      <p className="font-semibold">{name}</p>
      <p className="mt-2 text-sm text-brand-accent">{description}</p>
      <p className="mt-4 text-xs text-brand-accent">
        Replace this file with your Stitch export in{' '}
        <code className="rounded bg-white px-1">apps/web/src/components/lime/</code>
      </p>
    </div>
  );
}
