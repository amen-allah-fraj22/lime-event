/** Coerce wizard form values before PATCH /artists/:id */
export function normalizeWizardPayload(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };

  const intFields = [
    'years_experience',
    'band_size',
    'setup_time_minutes',
    'setlist_duration_min',
    'setlist_duration_max',
    'travel_radius_km',
  ] as const;

  for (const key of intFields) {
    if (key in out) {
      const v = out[key];
      if (v === '' || v === null || v === undefined) {
        delete out[key];
      } else {
        const n = Number(v);
        if (!Number.isNaN(n)) out[key] = n;
        else delete out[key];
      }
    }
  }

  if (Array.isArray(out.band_members)) {
    out.band_members = (out.band_members as { name?: string; role?: string; instrument?: string }[])
      .filter((m) => m.name?.trim() || m.role?.trim() || m.instrument?.trim())
      .map((m) => ({
        name: m.name?.trim() ?? '',
        role: m.role?.trim() ?? '',
        instrument: m.instrument?.trim() ?? '',
      }));
  }

  if (Array.isArray(out.portfolio_links)) {
    out.portfolio_links = (
      out.portfolio_links as { type?: string; url?: string; label?: string }[]
    )
      .filter((l) => l.url?.trim())
      .map((l) => ({
        type: l.type ?? 'Other',
        url: l.url!.trim(),
        label: l.label?.trim() || undefined,
      }));
  }

  for (const key of Object.keys(out)) {
    if (out[key] === '') delete out[key];
  }

  return out;
}
