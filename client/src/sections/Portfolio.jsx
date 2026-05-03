import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import './Portfolio.css';

// ============================================================
//  ===== הוסף כאן את הסרטונים והתמונות שלך =====
//
//  3 סוגים:
//
//  ① YouTube — type: 'youtube'
//     youtubeId: 11 התווים שבסוף הקישור
//     לדוגמה: youtube.com/watch?v=ABC12345678
//              → youtubeId: 'ABC12345678'
//
//  ② תמונה מ-Drive — type: 'drive-image'
//     driveId: מזהה הקובץ מהקישור
//     לדוגמה: drive.google.com/file/d/1aBcXXXXXXXX/view
//              → driveId: '1aBcXXXXXXXX'
//     * שים את הקובץ כ-"כל מי שיש לו קישור יכול לצפות"
//
//  ③ וידאו מ-Drive — type: 'drive-video'
//     driveId: אותו פורמט כמו למעלה
//     thumbnail (אופציונלי): URL לתמונת כיסוי
//
//  title: כותרת שמוצגת ב-hover
// ============================================================
const PORTFOLIO_ITEMS = [
  { id: 1, type: 'youtube',     youtubeId: 'REPLACE_ME', title: 'שם הסרטון 1' },
  { id: 2, type: 'youtube',     youtubeId: 'REPLACE_ME', title: 'שם הסרטון 2' },
  { id: 3, type: 'youtube',     youtubeId: 'REPLACE_ME', title: 'שם הסרטון 3' },
  { id: 4, type: 'youtube',     youtubeId: 'REPLACE_ME', title: 'שם הסרטון 4' },
  { id: 5, type: 'drive-image', driveId:   'REPLACE_ME', title: 'שם התמונה 1' },
  { id: 6, type: 'drive-image', driveId:   'REPLACE_ME', title: 'שם התמונה 2' },
  { id: 7, type: 'drive-video', driveId:   'REPLACE_ME', title: 'שם הוידאו 1' },
  { id: 8, type: 'drive-video', driveId:   'REPLACE_ME', title: 'שם הוידאו 2' },
];

// ── helpers ──────────────────────────────────────────────────
function getThumbSrc(item) {
  if (item.type === 'youtube') {
    return `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
  }
  if (item.type === 'drive-image' || item.type === 'drive-video') {
    // works for both images and videos in Drive
    return `https://drive.google.com/thumbnail?id=${item.driveId}&sz=w800`;
  }
  return item.thumbnail || null;
}

function isVideoType(item) {
  return item.type === 'youtube' || item.type === 'drive-video';
}

// ── Lightbox content ─────────────────────────────────────────
function LightboxContent({ item }) {
  if (item.type === 'youtube') {
    return (
      <div className="lightbox__video">
        <iframe
          src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
          title={item.title || 'סרטון'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (item.type === 'drive-video') {
    return (
      <div className="lightbox__video">
        <iframe
          src={`https://drive.google.com/file/d/${item.driveId}/preview`}
          title={item.title || 'סרטון'}
          allow="autoplay"
          allowFullScreen
        />
      </div>
    );
  }
  if (item.type === 'drive-image') {
    return (
      <div className="lightbox__image">
        <img
          src={`https://lh3.googleusercontent.com/d/${item.driveId}`}
          alt={item.title || ''}
          onError={(e) => {
            e.currentTarget.src = `https://drive.google.com/thumbnail?id=${item.driveId}&sz=w1600`;
          }}
        />
      </div>
    );
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────
export function Portfolio() {
  const [lightbox, setLightbox] = useState(null);

  return (
    <section id="portfolio" className="portfolio">
      <div className="collage-grid">
        {PORTFOLIO_ITEMS.map((item) => {
          const thumb = getThumbSrc(item);
          const isVid = isVideoType(item);

          return (
            <div
              key={item.id}
              className="collage-item"
              onClick={() => setLightbox(item)}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={item.title || ''}
                  className="collage-thumb"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="collage-thumb collage-thumb--placeholder" />
              )}

              <div className="collage-overlay">
                {isVid && (
                  <div className="collage-play">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)}>
        {lightbox && (
          <div className="lightbox">
            <LightboxContent item={lightbox} />
          </div>
        )}
      </Modal>
    </section>
  );
}
