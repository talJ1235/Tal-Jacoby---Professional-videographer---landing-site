// Content source of truth is content/works.json (edited via /admin → תוכן and
// published as a git commit). This module just imports it at build time and
// exposes the published works in display order (array order = display order).
import worksData from '@content/works.json';

export const works = worksData.filter((w) => w.published !== false);
