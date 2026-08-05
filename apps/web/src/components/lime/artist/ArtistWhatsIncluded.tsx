'use client';

import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { NEEDS_OPTIONS, PROVIDES_OPTIONS } from '@/lib/artist-equipment-options';

export function ArtistWhatsIncluded({ profile }: { profile: Record<string, unknown> }) {
  const provides = PROVIDES_OPTIONS.filter((o) => profile[o.key]);
  const needs = NEEDS_OPTIONS.filter((o) => profile[o.key]);

  return (
    <section className="mt-10">
      <h3 className="font-headline text-headline-md text-on-surface">What&apos;s included</h3>
      <p className="mt-1 text-sm text-secondary">
        Clear expectations before you send a booking request.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-primary-container/50 bg-lime/10 p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold text-on-surface">
            <MaterialIcon name="check_circle" size={20} className="text-primary" />
            Artist brings
          </p>
          {provides.length > 0 ? (
            <ul className="space-y-2">
              {provides.map((o) => (
                <li key={o.key} className="flex items-center gap-2 text-sm">
                  <MaterialIcon name={o.icon} size={18} className="text-primary" />
                  {o.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-secondary">Personal instruments / performance only</p>
          )}
          {typeof profile.equipment_notes === 'string' && profile.equipment_notes.trim() && (
            <p className="mt-3 text-sm text-secondary">{profile.equipment_notes}</p>
          )}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold text-on-surface">
            <MaterialIcon name="checklist" size={20} className="text-amber-700" />
            Organiser provides
          </p>
          {needs.length > 0 ? (
            <ul className="space-y-2">
              {needs.map((o) => (
                <li key={o.key} className="flex items-center gap-2 text-sm">
                  <MaterialIcon name={o.icon} size={18} className="text-amber-700" />
                  {o.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-secondary">No specific requirements listed</p>
          )}
          {typeof profile.requirements_notes === 'string' &&
            profile.requirements_notes.trim() && (
              <p className="mt-3 text-sm text-secondary">{profile.requirements_notes}</p>
            )}
        </div>
      </div>
    </section>
  );
}
