export type PortfolioItem = {
  title: string;
  url?: string;
  platform?: string;
  thumbnail?: string;
};

export function parsePortfolioLinks(raw: unknown): PortfolioItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item): PortfolioItem | null => {
        if (typeof item === 'string') {
          return { title: item, url: item };
        }
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          const title =
            (typeof o.title === 'string' && o.title) ||
            (typeof o.name === 'string' && o.name) ||
            (typeof o.label === 'string' && o.label) ||
            'Portfolio item';
          return {
            title,
            url: typeof o.url === 'string' ? o.url : undefined,
            platform:
              (typeof o.platform === 'string' && o.platform) ||
              (typeof o.type === 'string' && o.type) ||
              undefined,
            thumbnail: typeof o.thumbnail === 'string' ? o.thumbnail : undefined,
          };
        }
        return null;
      })
      .filter((x): x is PortfolioItem => x !== null);
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (typeof o.url === 'string') {
      return [
        {
          title: typeof o.title === 'string' ? o.title : 'Portfolio',
          url: o.url,
          platform: typeof o.platform === 'string' ? o.platform : undefined,
        },
      ];
    }
  }
  return [];
}
