import { useState } from 'react';

export function PublishBar({ dirty, summary, publishing, result, onPublish, onCancel }) {
  const [confirming, setConfirming] = useState(false);

  const doPublish = async () => {
    setConfirming(false);
    await onPublish();
  };

  return (
    <div className="publish-bar">
      <div className="publish-bar__summary">
        {result?.ok ? (
          <span className="publish-ok">
            פורסם. האתר יתעדכן תוך כ־2 דקות —{' '}
            <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a>
          </span>
        ) : result?.error ? (
          <span className="publish-err">{result.error}</span>
        ) : dirty ? (
          summary.map((s, i) => <span key={i} className="publish-chip">{s}</span>)
        ) : (
          <span className="publish-clean">אין שינויים לפרסום</span>
        )}
      </div>

      <div className="publish-bar__actions">
        {dirty && !publishing && (
          <button type="button" className="publish-cancel" onClick={onCancel}>
            בטל שינויים
          </button>
        )}
        <button
          type="button"
          className="publish-go"
          disabled={!dirty || publishing}
          onClick={() => setConfirming(true)}
        >
          {publishing ? 'מפרסם…' : 'שמור ופרסם'}
        </button>
      </div>

      {confirming && (
        <div className="publish-confirm" role="dialog" aria-modal="true">
          <div className="publish-confirm__box">
            <h3>לפרסם את השינויים?</h3>
            <ul>
              {summary.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <p className="publish-confirm__note">ייווצר קומיט אחד; האתר החי יתעדכן תוך כ־2 דקות.</p>
            <div className="publish-confirm__actions">
              <button type="button" className="publish-cancel" onClick={() => setConfirming(false)}>
                חזרה
              </button>
              <button type="button" className="publish-go" onClick={doPublish}>
                פרסם
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
