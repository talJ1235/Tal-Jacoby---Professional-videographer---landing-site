import { useEffect, useState, useCallback } from 'react';
import bundledSite from '@content/site.json';
import bundledWorks from '@content/works.json';
import { getContentState, uploadContentBlob, publishContent } from '../../services/api';
import { WorksManager } from './WorksManager';
import { SiteTexts } from './SiteTexts';
import { PublishBar } from './PublishBar';
import { PreviewPane } from './PreviewPane';
import { mediaRepoPath, changeSummary, isDirty } from './lib';
import './content.css';

const LIVE_URL = 'https://www.taljacoby.co.il';
const clone = (v) => JSON.parse(JSON.stringify(v));

export function ContentEditor({ password }) {
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState('');
  const [baseline, setBaseline] = useState({ site: bundledSite, works: bundledWorks });
  const [draft, setDraft] = useState({ site: clone(bundledSite), works: clone(bundledWorks) });
  const [stagedFiles, setStagedFiles] = useState({}); // repoPath -> base64
  const [deletedPaths, setDeletedPaths] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null); // { ok, url } | { error }

  // Load latest published truth from GitHub; fall back to bundled defaults.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await getContentState(password);
        if (!alive) return;
        const site = data.site || bundledSite;
        const works = data.works || bundledWorks;
        setBaseline({ site, works });
        setDraft({ site: clone(site), works: clone(works) });
        if (!data.site || !data.works) {
          setLoadWarning('לא נמצא תוכן שפורסם עדיין — נטענו ערכי ברירת המחדל.');
        }
      } catch (e) {
        if (!alive) return;
        setLoadWarning(
          'לא ניתן לטעון את התוכן מ־GitHub (' +
            (e.response?.data?.error || e.message) +
            '). נטענו ערכי ברירת המחדל — אפשר לערוך, אך ודא שהחיבור תקין לפני פרסום.'
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [password]);

  // ── Draft mutations ────────────────────────────────────────────
  const updateSite = useCallback((patch) => {
    setDraft((d) => ({ ...d, site: { ...d.site, ...patch, footer: { ...d.site.footer, ...(patch.footer || {}) } } }));
  }, []);

  const updateWork = useCallback((id, patch) => {
    setDraft((d) => ({ ...d, works: d.works.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  }, []);

  const reorderWorks = useCallback((newWorks) => {
    setDraft((d) => ({ ...d, works: newWorks }));
  }, []);

  const addWork = useCallback((work) => {
    setDraft((d) => ({ ...d, works: [...d.works, work] }));
  }, []);

  const deleteWork = useCallback((id) => {
    setDraft((d) => ({ ...d, works: d.works.filter((w) => w.id !== id) }));
    // unstage any pending files for this work; stage its media folder for deletion
    setStagedFiles((s) => {
      const next = { ...s };
      Object.keys(next).forEach((p) => {
        if (p.includes(`/works/${id}/`)) delete next[p];
      });
      return next;
    });
    setDeletedPaths((d) => {
      const paths = [mediaRepoPath(id, 'thumb.webp'), mediaRepoPath(id, 'preview.mp4')];
      return Array.from(new Set([...d, ...paths]));
    });
  }, []);

  const stageFile = useCallback((repoPath, base64) => {
    setStagedFiles((s) => ({ ...s, [repoPath]: base64 }));
    // if we previously staged this path for deletion, unstage the deletion
    setDeletedPaths((d) => d.filter((p) => p !== repoPath));
  }, []);

  // ── Publish / cancel ───────────────────────────────────────────
  const dirty = isDirty(baseline, draft, stagedFiles, deletedPaths);
  const summary = changeSummary(baseline, draft, stagedFiles, deletedPaths);

  const handleCancel = () => {
    setDraft({ site: clone(baseline.site), works: clone(baseline.works) });
    setStagedFiles({});
    setDeletedPaths([]);
    setResult(null);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setResult(null);
    try {
      // 1. upload staged media as blobs
      const blobs = [];
      for (const [path, base64] of Object.entries(stagedFiles)) {
        const { data } = await uploadContentBlob(password, path, base64);
        blobs.push({ path: data.path, sha: data.sha });
      }
      // 2. atomic publish commit
      const message = summary.join(', ') || 'update content';
      const { data } = await publishContent(password, {
        siteJson: draft.site,
        worksJson: draft.works,
        blobs,
        deletedPaths,
        message,
      });
      // 3. success → new baseline
      setBaseline({ site: clone(draft.site), works: clone(draft.works) });
      setStagedFiles({});
      setDeletedPaths([]);
      setResult({ ok: true, url: LIVE_URL, commitUrl: data.commitUrl });
    } catch (e) {
      setResult({ error: e.response?.data?.error || e.message || 'הפרסום נכשל' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <p className="content-loading">טוען תוכן…</p>;

  return (
    <div className="content-editor">
      {loadWarning && <div className="content-warning">{loadWarning}</div>}

      <div className="ce-split">
        <div className="ce-controls">
          <WorksManager
            works={draft.works}
            stagedFiles={stagedFiles}
            onReorder={reorderWorks}
            onUpdate={updateWork}
            onAdd={addWork}
            onDelete={deleteWork}
            onStageFile={stageFile}
          />

          <SiteTexts site={draft.site} onChange={updateSite} />
        </div>

        <PreviewPane draft={draft} />
      </div>

      <PublishBar
        dirty={dirty}
        summary={summary}
        publishing={publishing}
        result={result}
        onPublish={handlePublish}
        onCancel={handleCancel}
      />
    </div>
  );
}
