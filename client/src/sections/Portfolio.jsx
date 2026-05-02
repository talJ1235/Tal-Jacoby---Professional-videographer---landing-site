import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import './Portfolio.css';

// ============================================================
// הוסף כאן את הסרטונים שלך
// youtubeId — 11 התווים שבסוף קישור היוטיוב
//   לדוגמה: youtube.com/watch?v=dQw4w9WgXcQ → youtubeId: 'dQw4w9WgXcQ'
// ============================================================
const PORTFOLIO_ITEMS = [
  { id: 1, youtubeId: 'dQw4w9WgXcQ' },
  { id: 2, youtubeId: 'dQw4w9WgXcQ' },
  { id: 3, youtubeId: 'dQw4w9WgXcQ' },
  { id: 4, youtubeId: 'dQw4w9WgXcQ' },
  { id: 5, youtubeId: 'dQw4w9WgXcQ' },
  { id: 6, youtubeId: 'dQw4w9WgXcQ' },
  { id: 7, youtubeId: 'dQw4w9WgXcQ' },
  { id: 8, youtubeId: 'dQw4w9WgXcQ' },
];

export function Portfolio() {
  const [lightbox, setLightbox] = useState(null);

  return (
    <section id="portfolio" className="portfolio">
      <div className="collage-grid">
        {PORTFOLIO_ITEMS.map((item) => (
          <div
            key={item.id}
            className="collage-item"
            onClick={() => setLightbox(item)}
          >
            <img
              src={`https://img.youtube.com/vi/${item.youtubeId}/maxresdefault.jpg`}
              alt=""
              className="collage-thumb"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="collage-overlay">
              <div className="collage-play">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)}>
        {lightbox && (
          <div className="lightbox">
            <div className="lightbox__video">
              <iframe
                src={`https://www.youtube.com/embed/${lightbox.youtubeId}?autoplay=1`}
                title="סרטון"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
