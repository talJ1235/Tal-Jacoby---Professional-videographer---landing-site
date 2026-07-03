import { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import {
  slugify,
  parseYouTubeId,
  ytThumb,
  mediaUrl,
  mediaRepoPath,
  imageToWebpBase64,
  fileToBase64,
  PREVIEW_MAX_BYTES,
} from './lib';

const CATEGORY_LABELS = { events: 'אירועים', business: 'עסקים' };
const FFMPEG_HINT =
  'ffmpeg -ss 00:00:12 -t 4 -i source.mp4 -an -vf "scale=960:-2,fps=25" -c:v libx264 -crf 27 -pix_fmt yuv420p -movflags +faststart preview.mp4';

function WorkRow({ work, stagedFiles, onUpdate, onDelete, onStageFile }) {
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [ytInput, setYtInput] = useState(work.youtubeId || '');
  const [ytError, setYtError] = useState('');
  const [thumbBusy, setThumbBusy] = useState(false);
  const [fileError, setFileError] = useState('');

  const stagedThumb = stagedFiles[mediaRepoPath(work.id, 'thumb.webp')];
  const thumbSrc = stagedThumb
    ? `data:image/webp;base64,${stagedThumb}`
    : work.youtubeId
    ? ytThumb(work.youtubeId)
    : null;

  const onYtChange = (v) => {
    setYtInput(v);
    if (!v.trim()) {
      setYtError('');
      onUpdate(work.id, { youtubeId: '' });
      return;
    }
    const id = parseYouTubeId(v);
    if (id) {
      setYtError('');
      onUpdate(work.id, { youtubeId: id });
    } else {
      setYtError('קישור / מזהה יוטיוב לא תקין');
    }
  };

  const onThumb = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError('');
    setThumbBusy(true);
    try {
      const base64 = await imageToWebpBase64(file);
      onStageFile(mediaRepoPath(work.id, 'thumb.webp'), base64);
      onUpdate(work.id, { thumb: mediaUrl(work.id, 'thumb.webp') });
    } catch (err) {
      setFileError(err.message || 'שגיאה בעיבוד התמונה');
    } finally {
      setThumbBusy(false);
    }
  };

  const onPreview = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError('');
    if (!/\.mp4$/i.test(file.name) && file.type !== 'video/mp4') {
      setFileError('יש להעלות קובץ mp4 בלבד.');
      return;
    }
    if (file.size > PREVIEW_MAX_BYTES) {
      setFileError(`הקובץ גדול מדי (מעל 2.5MB). כווץ אותו כך:\n${FFMPEG_HINT}`);
      return;
    }
    const base64 = await fileToBase64(file);
    onStageFile(mediaRepoPath(work.id, 'preview.mp4'), base64);
    onUpdate(work.id, { preview: mediaUrl(work.id, 'preview.mp4') });
  };

  return (
    <Reorder.Item value={work} dragListener={false} dragControls={controls} className="cw-item">
      <div className="cw-row">
        <button
          type="button"
          className="cw-drag"
          aria-label="גרור לשינוי סדר"
          onPointerDown={(e) => controls.start(e)}
        >
          ⋮⋮
        </button>
        <button type="button" className="cw-row__main" onClick={() => setOpen((o) => !o)}>
          <span className="cw-row__title">{work.title || '(ללא כותרת)'}</span>
          <span className="cw-row__cat">{CATEGORY_LABELS[work.category]}</span>
        </button>
        <label className="cw-pub" title="מוצג באתר">
          <input
            type="checkbox"
            checked={work.published !== false}
            onChange={(e) => onUpdate(work.id, { published: e.target.checked })}
          />
          <span>{work.published !== false ? 'מוצג' : 'מוסתר'}</span>
        </label>
        <span className="cw-row__chevron">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="cw-edit">
          <div className="cw-grid">
            <label className="cw-field">
              <span>כותרת</span>
              <input value={work.title} onChange={(e) => onUpdate(work.id, { title: e.target.value })} />
            </label>
            <label className="cw-field">
              <span>תיאור (עיר / סוג)</span>
              <input value={work.tag} onChange={(e) => onUpdate(work.id, { tag: e.target.value })} />
            </label>
            <label className="cw-field">
              <span>קטגוריה</span>
              <select value={work.category} onChange={(e) => onUpdate(work.id, { category: e.target.value })}>
                <option value="events">אירועים</option>
                <option value="business">עסקים</option>
              </select>
            </label>
            <label className="cw-field">
              <span>קישור יוטיוב</span>
              <input
                value={ytInput}
                placeholder="https://youtu.be/… או מזהה"
                onChange={(e) => onYtChange(e.target.value)}
              />
              {ytError && <em className="cw-err">{ytError}</em>}
            </label>
          </div>

          <div className="cw-media">
            <div className="cw-thumb">
              {thumbSrc ? (
                <img src={thumbSrc} alt="תמונה ממוזערת" />
              ) : (
                <div className="cw-thumb__empty">אין תמונה</div>
              )}
              <label className="cw-upload">
                {thumbBusy ? 'מעבד…' : 'העלה תמונה'}
                <input type="file" accept="image/*" onChange={onThumb} hidden disabled={thumbBusy} />
              </label>
              {stagedThumb && <span className="cw-staged">חדש ✓</span>}
            </div>
            <div className="cw-thumb">
              <div className="cw-thumb__empty">
                {stagedFiles[mediaRepoPath(work.id, 'preview.mp4')] ? 'תצוגה מקדימה חדשה ✓' : 'תצוגה מקדימה (mp4)'}
              </div>
              <label className="cw-upload">
                העלה וידאו
                <input type="file" accept="video/mp4" onChange={onPreview} hidden />
              </label>
            </div>
          </div>

          {fileError && <pre className="cw-err cw-err--block">{fileError}</pre>}

          <div className="cw-actions">
            {confirmDel ? (
              <span className="cw-confirm">
                למחוק?
                <button type="button" className="cw-yes" onClick={() => onDelete(work.id)}>כן</button>
                <button type="button" className="cw-no" onClick={() => setConfirmDel(false)}>לא</button>
              </span>
            ) : (
              <button type="button" className="cw-delete" onClick={() => setConfirmDel(true)}>
                מחק עבודה
              </button>
            )}
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

export function WorksManager({ works, stagedFiles, onReorder, onUpdate, onAdd, onDelete, onStageFile }) {
  const handleAdd = () => {
    const id = slugify('', works.map((w) => w.id), works.length + 1);
    onAdd({
      id,
      title: '',
      tag: '',
      category: 'events',
      youtubeId: '',
      thumb: mediaUrl(id, 'thumb.webp'),
      preview: mediaUrl(id, 'preview.mp4'),
      published: true,
    });
  };

  return (
    <section className="content-section">
      <div className="content-section__head">
        <h2>עבודות</h2>
        <button type="button" className="cw-add" onClick={handleAdd}>+ עבודה חדשה</button>
      </div>
      <p className="content-hint">גרור עם הידית ⋮⋮ כדי לשנות סדר. העבודה הראשונה מוצגת ברוחב מלא.</p>

      <Reorder.Group axis="y" values={works} onReorder={onReorder} className="cw-list">
        {works.map((work) => (
          <WorkRow
            key={work.id}
            work={work}
            stagedFiles={stagedFiles}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onStageFile={onStageFile}
          />
        ))}
      </Reorder.Group>
    </section>
  );
}
