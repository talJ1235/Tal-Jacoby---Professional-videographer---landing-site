// Helpers for the content editor: slugs, YouTube parsing, image → WebP, diffs.

export const MEDIA_ROOT = 'client/public/media/works';
export const PREVIEW_MAX_BYTES = 2.5 * 1024 * 1024;

// Transliterate a title to a latin lowercase-dash slug; fallback work-<n>.
export function slugify(title, existingIds, n) {
  const base = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // drop non-latin (e.g. Hebrew)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  let slug = base || `work-${n}`;
  // ensure uniqueness
  let candidate = slug;
  let i = 2;
  const taken = new Set(existingIds);
  while (taken.has(candidate)) candidate = `${slug}-${i++}`;
  return candidate;
}

// Extract an 11-char YouTube id from a full URL or a bare id. '' if none.
export function parseYouTubeId(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : '';
}

export function ytThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// Public URL and repo path for a work's media file.
export function mediaUrl(id, file) {
  return `/media/works/${id}/${file}`;
}
export function mediaRepoPath(id, file) {
  return `${MEDIA_ROOT}/${id}/${file}`;
}

// Read a File as a base64 string (no data: prefix).
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Crop/resize any image File to 1600×900 cover-fit WebP; returns base64 (no prefix).
export function imageToWebpBase64(file, w = 1600, h = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // cover-fit
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('WebP export failed'));
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('לא ניתן לקרוא את התמונה'));
    };
    img.src = url;
  });
}

// Human (Hebrew) change summary between baseline and draft.
export function changeSummary(baseline, draft, stagedFiles, deletedPaths) {
  const parts = [];
  const baseWorks = baseline.works || [];
  const draftWorks = draft.works || [];
  const baseById = new Map(baseWorks.map((w) => [w.id, w]));
  const draftIds = new Set(draftWorks.map((w) => w.id));

  const added = draftWorks.filter((w) => !baseById.has(w.id)).length;
  const removed = baseWorks.filter((w) => !draftIds.has(w.id)).length;
  let updated = 0;
  let reordered = false;
  draftWorks.forEach((w, idx) => {
    const b = baseById.get(w.id);
    if (b && JSON.stringify(b) !== JSON.stringify(w)) updated++;
    if (b && baseWorks[idx] && baseWorks[idx].id !== w.id) reordered = true;
  });

  if (added) parts.push(`${added} עבודות נוספו`);
  if (removed) parts.push(`${removed} עבודות נמחקו`);
  if (updated) parts.push(`${updated} עבודות עודכנו`);
  if (reordered && !added && !removed) parts.push('הסדר שונה');
  const fileCount = Object.keys(stagedFiles || {}).length;
  if (fileCount) parts.push(`${fileCount} קבצים נוספו`);
  if ((deletedPaths || []).length) parts.push(`${deletedPaths.length} קבצים נמחקו`);
  if (JSON.stringify(baseline.site) !== JSON.stringify(draft.site)) parts.push('הטקסטים עודכנו');

  return parts;
}

export function isDirty(baseline, draft, stagedFiles, deletedPaths) {
  return changeSummary(baseline, draft, stagedFiles, deletedPaths).length > 0;
}
