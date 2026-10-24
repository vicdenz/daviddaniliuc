import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import UsageStatus from "./UsageStatus.jsx";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FlaskConical,
  LayoutGrid,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
  X,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  NotebookPen,
  Database,
  Upload,
  AlertCircle,
} from "lucide-react";
import "./style.css";
const appBase = import.meta.env.BASE_URL;
const apiPath = (path) => (import.meta.env.VITE_API_BASE || appBase + "api") + path;
self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};
loader.config({ monaco });
monaco.editor.defineTheme("prep", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "777777", fontStyle: "italic" },
    { token: "keyword", foreground: "c7adff" },
    { token: "string", foreground: "d0d0d0" },
    { token: "number", foreground: "bca4e0" },
    { token: "type.identifier", foreground: "dfc9fa" },
  ],
  colors: {
    "editor.background": "#111111",
    "editor.foreground": "#dddddd",
    "editorLineNumber.foreground": "#595959",
    "editorLineNumber.activeForeground": "#aaaaaa",
    "editor.lineHighlightBackground": "#191919",
    "editor.selectionBackground": "#38264e",
    "editorCursor.foreground": "#a78bfa",
    "editorWidget.background": "#1c1c1c",
    "editorIndentGuide.background1": "#2b2b2b",
    "editorBracketHighlight.foreground1": "#bca4e0",
    "editorBracketHighlight.foreground2": "#d7c5ef",
    "editorBracketHighlight.foreground3": "#aaaaaa",
    "editorBracketHighlight.foreground4": "#bca4e0",
    "editorBracketHighlight.foreground5": "#d7c5ef",
    "editorBracketHighlight.foreground6": "#aaaaaa",
    "editorBracketMatch.background": "#292032",
    "editorBracketMatch.border": "#795b9e",
  },
});
async function api(url, options) {
  if (typeof options?.body === "string" && options.body.length > 1000000 && typeof CompressionStream !== "undefined") {
    const compressed = new Blob([options.body]).stream().pipeThrough(new CompressionStream("gzip"));
    options = { ...options, body: await new Response(compressed).arrayBuffer(), headers: { ...options.headers, "Content-Encoding": "gzip" } };
  }
  const r = await fetch(apiPath(url), {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!r.ok) {
    let data;
    try {
      data = await r.json();
    } catch {}
    if (r.status === 401 && !url.startsWith("/auth/"))
      window.dispatchEvent(new Event("prep:expired"));
    throw new Error(data?.error || `Request failed (${r.status})`);
  }
  let data = await r.json();
  while (data.jobId && data.pending) {
    if (data.retryAfter) await new Promise((resolve) => setTimeout(resolve, data.retryAfter));
    const next = await fetch(apiPath(`/jobs/${data.jobId}/advance`), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    data = await next.json();
    if (!next.ok) throw new Error(data.error || `Request failed (${next.status})`);
  }
  if (url.endsWith("/run") || url.endsWith("/prepare")) window.dispatchEvent(new Event("prep:usage"));
  return data;
}
const send = (url, body, method = "PUT") =>
  api(url, { method, body: JSON.stringify(body) });
const pretty = (x) => JSON.stringify(x, null, 2);
const statusLabel = {
  todo: "Not started",
  attempted: "In progress",
  solved: "Solved",
};
const provenance = (c) =>
  c.provenance === "generated-new" &&
  c.referenceValidation?.startsWith("passed")
    ? "Generated · reference checked"
    : c.sourceVerified
      ? "Source example"
      : {
          "generated-existing": "Generated · imported",
          "generated-new": "Generated · visible",
          performance: "Local stress test",
          user: "Your test",
          "user-edited": "Edited by you",
          "local-extracted": "Original · extracted",
          "source-added": "Source example · added",
        }[c.provenance] || "Original local test";
function getDraft(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function saveDraft(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function removeDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
function App() {
  const [library, setLibrary] = useState([]),
    [health, setHealth] = useState(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(location.hash.slice(1) || null),
    [problem, setProblem] = useState(null),
    [loading, setLoading] = useState(false),
    [view, setView] = useState("library");
  const [search, setSearch] = useState(""),
    [company, setCompany] = useState("All companies"),
    [difficulty, setDifficulty] = useState("All difficulties"),
    [topic, setTopic] = useState("All topics"),
    [status, setStatus] = useState("All progress");
  const [language, setLanguage] = useState("python"),
    [code, setCode] = useState(""),
    [saveState, setSaveState] = useState("Saved locally"),
    [notes, setNotes] = useState(""),
    [tab, setTab] = useState("Description"),
    [caseTab, setCaseTab] = useState("Test cases"),
    [caseData, setCaseData] = useState(null),
    [activeCase, setActiveCase] = useState(null),
    [result, setResult] = useState(null),
    [running, setRunning] = useState(false),
    [runningMode, setRunningMode] = useState("run"),
    [caseSearch, setCaseSearch] = useState(""),
    [modal, setModal] = useState(null),
    [file, setFile] = useState(null),
    [hideSidebar, setHideSidebar] = useState(false);
  const [split, setSplit] = useState(
      Number(localStorage.getItem("prep-split")) || 44,
    ),
    [lower, setLower] = useState(
      Number(localStorage.getItem("prep-lower")) || 40,
    );
  const noteDirty = useRef(false),
    notesRef = useRef(""),
    dirty = useRef(false),
    codeRef = useRef(""),
    workRef = useRef({}),
    saveTimer = useRef(null),
    noteTimer = useRef(null),
    currentId = useRef(null),
    workspace = useRef(null),
    right = useRef(null),
    inputRef = useRef(null);
  useEffect(() => {
    const leave = () => {
      if (noteDirty.current && currentId.current)
        fetch(apiPath("/problems/" + currentId.current + "/progress"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesRef.current }),
          keepalive: true,
        });
      if (dirty.current && currentId.current)
        fetch(apiPath("/problems/" + currentId.current + "/work"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code: codeRef.current }),
          keepalive: true,
        });
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [language]);
  const refresh = useCallback(
    () =>
      api("/problems")
        .then(setLibrary)
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    const focus = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setView("library");
        setTimeout(
          () =>
            document
              .querySelector('input[aria-label="Search problems"]')
              ?.focus(),
          0,
        );
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, []);
  useEffect(() => {
    refresh();
    api("/health")
      .then(setHealth)
      .catch((e) => setError(e.message));
  }, [refresh]);
  useEffect(() => {
    const pop = () => {
      const id = location.hash.slice(1);
      setSelected(id || null);
      if (!id) setView("library");
    };
    window.addEventListener("hashchange", pop);
    return () => window.removeEventListener("hashchange", pop);
  }, []);
  const persist = useCallback(async (id, lang, text) => {
    if (!id) return;
    try {
      await send(`/problems/${id}/work`, { language: lang, code: text });
      if (getDraft(`prep-draft:${id}:${lang}`) === text)
        removeDraft(`prep-draft:${id}:${lang}`);
      if (currentId.current === id) setSaveState("Saved locally");
    } catch (e) {
      setError(e.message);
      setSaveState("Save failed");
      throw e;
    }
  }, []);
  async function flush() {
    clearTimeout(saveTimer.current);
    clearTimeout(noteTimer.current);
    if (currentId.current && noteDirty.current) {
      await send(`/problems/${currentId.current}/progress`, {
        notes: notesRef.current,
      });
      noteDirty.current = false;
    }
    if (currentId.current && dirty.current) {
      await persist(currentId.current, language, codeRef.current);
      dirty.current = false;
    }
  }
  useEffect(() => {
    if (!selected) return;
    let live = true;
    setLoading(true);
    api("/problems/" + selected)
      .then((p) => {
        if (!live) return;
        currentId.current = p.id;
        setProblem(p);
        workRef.current = { ...p.work };
        const lang = p.languages.includes(language) ? language : "python";
        setLanguage(lang);
        const draft = getDraft(`prep-draft:${p.id}:${lang}`);
        const value = draft ?? p.work[lang] ?? p.starters[lang];
        dirty.current = draft !== null;
        codeRef.current = value;
        workRef.current[lang] = value;
        setCode(value);
        setNotes(p.progress.notes);
        notesRef.current = p.progress.notes;
        noteDirty.current = false;
        setResult(p.submissions[0]?.result || null);
        setActiveCase(p.cases[0]?.id || null);
        setCaseData(null);
        setView("practice");
        setTab("Description");
        setSaveState(
          draft !== null ? "Recovered local draft" : "Saved locally",
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [selected]);
  useEffect(() => {
    if (!problem || !activeCase) return;
    let live = true;
    setCaseData(null);
    api(`/problems/${problem.id}/cases/${activeCase}`)
      .then((c) => {
        if (live) setCaseData(c);
      })
      .catch((e) => setError(e.message));
    return () => {
      live = false;
    };
  }, [problem?.id, activeCase]);
  function changeCode(value) {
    dirty.current = true;
    const text = value ?? "";
    saveDraft(`prep-draft:${problem.id}:${language}`, text);
    setCode(text);
    codeRef.current = text;
    workRef.current[language] = text;
    setSaveState("Saving…");
    clearTimeout(saveTimer.current);
    const id = problem.id,
      lang = language;
    saveTimer.current = setTimeout(async () => {
      try {
        await persist(id, lang, text);
        if (codeRef.current === text) dirty.current = false;
      } catch {}
    }, 450);
  }
  async function changeLanguage(lang) {
    await flush();
    setLanguage(lang);
    const text = workRef.current[lang] ?? problem.starters[lang];
    codeRef.current = text;
    setCode(text);
  }
  async function openProblem(id) {
    await flush();
    location.hash = id;
    if (selected === id) setView("practice");
    setSelected(id);
  }
  async function back() {
    await flush();
    setView("library");
    refresh();
  }
  async function run(mode = "run", ids = null) {
    if (!problem || running) return;
    await flush();
    setRunning(true);
    setRunningMode(mode);
    setCaseTab("Results");
    setError("");
    try {
      const r = await send(
        `/problems/${problem.id}/run`,
        { language, code: codeRef.current, mode, caseIds: ids },
        "POST",
      );
      setResult(r);
      setProblem((p) => ({
        ...p,
        progress: {
          ...p.progress,
          status:
            mode === "submit" && r.accepted
              ? "solved"
              : p.progress.status === "todo"
                ? "attempted"
                : p.progress.status,
        },
        submissions: [
          {
            id: r.submissionId,
            language,
            mode,
            created: new Date().toISOString(),
            result: r,
          },
          ...p.submissions,
        ],
      }));
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        run(
          e.shiftKey ? "submit" : "run",
          e.shiftKey ? null : activeCase ? [activeCase] : null,
        );
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [problem, language, activeCase, running]);
  async function loadSaved(source, lang = language) {
    await flush();
    try {
      const prepared = await send(
        `/problems/${problem.id}/prepare`,
        { code: source, language: lang },
        "POST",
      );
      source = prepared.code;
    } catch (e) {
      setError(e.message);
      return;
    }
    setLanguage(lang);
    setCode(source);
    codeRef.current = source;
    workRef.current[lang] = source;
    await persist(problem.id, lang, source);
    dirty.current = false;
  }
  function updateNotes(value) {
    noteDirty.current = true;
    notesRef.current = value;
    setNotes(value);
    clearTimeout(noteTimer.current);
    const id = problem.id;
    noteTimer.current = setTimeout(
      () =>
        send(`/problems/${id}/progress`, { notes: value })
          .then(() => {
            if (notesRef.current === value) noteDirty.current = false;
          })
          .catch((e) => setError(e.message)),
      450,
    );
  }
  async function changeStatus(value) {
    clearTimeout(noteTimer.current);
    await send(`/problems/${problem.id}/progress`, { notes, status: value });
    setProblem((p) => ({ ...p, progress: { ...p.progress, status: value } }));
    refresh();
  }
  async function reloadCases(choose) {
    const p = await api("/problems/" + problem.id);
    setProblem((old) => ({ ...old, cases: p.cases }));
    setActiveCase(choose || p.cases[0]?.id);
    if (choose === activeCase)
      setCaseData(await api(`/problems/${problem.id}/cases/${choose}`));
  }
  function drag(kind, e) {
    e.preventDefault();
    const target = kind === "split" ? workspace.current : right.current;
    const bounds = target.getBoundingClientRect();
    const move = (ev) => {
      if (kind === "split") {
        const value = Math.max(
          28,
          Math.min(65, ((ev.clientX - bounds.left) / bounds.width) * 100),
        );
        setSplit(value);
        localStorage.setItem("prep-split", value);
      } else {
        const value = Math.max(
          24,
          Math.min(75, ((bounds.bottom - ev.clientY) / bounds.height) * 100),
        );
        setLower(value);
        localStorage.setItem("prep-lower", value);
      }
    };
    const done = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", done);
      document.body.classList.remove("dragging");
    };
    document.body.classList.add("dragging");
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", done);
  }
  const companies = [...new Set(library.flatMap((p) => p.companies))].sort(),
    topics = [...new Set(library.flatMap((p) => p.topics))].sort();
  const filtered = library.filter(
    (p) =>
      (p.title + " " + p.companies.join(" ") + " " + p.topics.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (company === "All companies" || p.companies.includes(company)) &&
      (difficulty === "All difficulties" || p.difficulty === difficulty) &&
      (topic === "All topics" || p.topics.includes(topic)) &&
      (status === "All progress" || p.status === status),
  );
  const solved = library.filter((p) => p.status === "solved").length,
    attempted = library.filter((p) => p.status === "attempted").length;

  const currentResult = result?.results?.find((r) => r.id === activeCase),
    visibleCases =
      problem?.cases.filter((c) =>
        c.name.toLowerCase().includes(caseSearch.toLowerCase()),
      ) || [];
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (hideSidebar ? "collapsed" : "")}>
        <button className="brand" onClick={back}>
          <span className="brand-icon">
            <Code2 size={21} />
          </span>
          davidprep
        </button>

        <button
          className={"nav-item " + (view === "library" ? "active" : "")}
          onClick={back}
        >
          <LayoutGrid size={17} />
          Problem library<span className="nav-count">{library.length}</span>
        </button>
        <button
          className={"nav-item " + (view === "practice" ? "active" : "")}
          onClick={() =>
            problem
              ? setView("practice")
              : library[0] && openProblem(library[0].id)
          }
        >
          <Code2 size={17} />
          Practice workspace
        </button>
        <div className="sidebar-divider" />
        <div className="workspace-label">Companies</div>
        {["All companies", ...companies].map((c) => (
          <button
            key={c}
            className={"collection " + (company === c ? "selected" : "")}
            onClick={() => {
              setCompany(c);
              setView("library");
            }}
          >
            <span
              className={"collection-dot " + c.toLowerCase().split(" ")[0]}
            />
            {c === "All companies" ? "All problems" : c}
            <span>
              {c === "All companies"
                ? library.length
                : library.filter((p) => p.companies.includes(c)).length}
            </span>
          </button>
        ))}
        <div className="sidebar-bottom">
          <button
            className="subtle migration-link"
            onClick={() => setModal({ type: "migration" })}
          >
            <Database size={14} /> Import report <ArrowUpRight size={13} />
          </button>
          <button
            className="subtle migration-link"
            onClick={async () => {
              await flush();
              await send("/auth/logout", {}, "POST");
              window.dispatchEvent(new Event("prep:expired"));
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Toggle sidebar"
              onClick={() => setHideSidebar(!hideSidebar)}
            >
              {hideSidebar ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {view === "library"
                ? "Problem library"
                : problem?.title || "Practice"}
            </strong>
          </div>
          <UsageStatus request={api} />
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={17} />
            {error}
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {view === "library" ? (
          <div className="library-page">
            <div className="page-heading">
              <div>
                <h1>Problem library</h1>
                <p>
                  {library.length} problems · {solved} solved · {attempted} in
                  progress
                </p>
              </div>
              <button
                className="primary start-button"
                onClick={() => {
                  const p =
                    filtered.find((p) => p.status === "attempted") ||
                    filtered.find((p) => p.status === "todo") ||
                    filtered[0];
                  if (p) openProblem(p.id);
                }}
              >
                <Play size={16} fill="currentColor" />
                Practice
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="filter-toolbar">
              <label className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search problems"
                  placeholder="Search problems, topics, companies…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <kbd>⌘ K</kbd>
              </label>
              <Select
                value={company}
                onChange={setCompany}
                options={["All companies", ...companies]}
                label="Company"
              />
              <Select
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  "All difficulties",
                  ...new Set(library.map((p) => p.difficulty)),
                ]}
                label="Difficulty"
              />
              <Select
                value={topic}
                onChange={setTopic}
                options={["All topics", ...topics]}
                label="Topic"
              />
              <Select
                value={status}
                onChange={setStatus}
                options={["All progress", "todo", "attempted", "solved"]}
                labels={statusLabel}
                label="Progress"
              />
            </div>
            <div className="problem-table-wrap">
              <table className="problem-table">
                <thead>
                  <tr>
                    <th className="status-col">STATUS</th>
                    <th>PROBLEM</th>
                    <th>DIFFICULTY</th>
                    <th>COMPANY</th>
                    <th>TOPICS</th>
                    <th>TESTS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} onClick={() => openProblem(p.id)}>
                      <td>
                        <StatusIcon status={p.status} />
                      </td>
                      <td>
                        <button
                          className="problem-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProblem(p.id);
                          }}
                        >
                          <span className="row-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {p.title}
                        </button>
                        {p.verification.status === "manual" && (
                          <span className="needs-review">
                            Source needs review
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={"difficulty " + p.difficulty.toLowerCase()}
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td>
                        <div className="company-tags">
                          {p.companies.map((c) => (
                            <span key={c}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="topic-tags">
                          {p.topics.slice(0, 2).map((t) => (
                            <span key={t}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="test-count">
                        <FlaskConical size={13} />
                        {p.testCount}
                      </td>
                      <td>
                        <ArrowUpRight size={16} className="row-arrow" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>No problems found</h3>
                  <p>Try a different search or clear a filter.</p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setCompany("All companies");
                      setDifficulty("All difficulties");
                      setTopic("All topics");
                      setStatus("All progress");
                    }}
                    className="secondary"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            <footer className="library-footer">
              <span>
                Showing {filtered.length} of {library.length} problems
              </span>
            </footer>
          </div>
        ) : loading || !problem ? (
          <div className="loading">
            <Loader2 className="spin" />
            Loading problem…
          </div>
        ) : (
          <div className="practice-page">
            <div className="practice-toolbar">
              <div className="practice-nav">
                <button className="secondary" onClick={back}>
                  <ArrowLeft size={14} /> Library
                </button>
                <span className="toolbar-divider" />
                <span
                  className={"difficulty " + problem.difficulty.toLowerCase()}
                >
                  {problem.difficulty}
                </span>
                <Select
                  label="Completion status"
                  value={problem.progress.status}
                  onChange={changeStatus}
                  options={["todo", "attempted", "solved"]}
                  labels={statusLabel}
                />
              </div>
              <div className="run-actions">
                <button
                  className="secondary"
                  disabled={running}
                  onClick={() => run("run", activeCase ? [activeCase] : null)}
                >
                  {running && runningMode === "run" ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <Play size={15} />
                  )}
                  Run case
                </button>
                <button
                  className="secondary"
                  disabled={running}
                  onClick={() => run("run")}
                >
                  Run all
                </button>
                <button
                  className="primary"
                  disabled={running}
                  onClick={() => run("submit")}
                >
                  {running && runningMode === "submit" ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                  Submit all {problem.cases.length} tests
                </button>
              </div>
            </div>
            <div
              className="workspace"
              ref={workspace}
              style={{
                gridTemplateColumns: `minmax(0,${split}fr) 7px minmax(0,${100 - split}fr)`,
              }}
            >
              <section className="description-panel">
                <div className="panel-tabs">
                  {[
                    ["Description", FileText],
                    ["Notes", NotebookPen],
                    ["Solutions", Code2],
                    ["Sources", ShieldCheck],
                  ].map(([t, Icon]) => (
                    <button
                      key={t}
                      className={tab === t ? "selected" : ""}
                      onClick={() => setTab(t)}
                    >
                      <Icon size={14} />
                      {t}
                    </button>
                  ))}
                </div>
                <div className="description-scroll">
                  {tab === "Description" && (
                    <>
                      <div className="problem-eyebrow">
                        {problem.companies.join(" / ")}
                        <span>•</span>
                        {problem.topics.join(" · ")}
                      </div>
                      <h1 className="practice-title">{problem.title}</h1>
                      <div className="problem-meta">
                        <span
                          className={
                            "difficulty " + problem.difficulty.toLowerCase()
                          }
                        >
                          {problem.difficulty}
                        </span>
                        {problem.platformSource && (
                          <a
                            href={problem.platformSource.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {problem.platformSource.platform}{" "}
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <span>
                          <FlaskConical size={13} />
                          {problem.cases.length} visible tests
                        </span>
                        <span>
                          <StatusIcon status={problem.progress.status} />
                          {statusLabel[problem.progress.status]}
                        </span>
                      </div>
                      {problem.verification.status === "manual" && (
                        <div className="notice">
                          <AlertCircle size={16} />
                          <span>
                            {problem.verification.notes?.[0] ||
                              "Original source still needs verification."}
                          </span>
                        </div>
                      )}
                      {problem.verification.manual?.length > 0 && (
                        <div className="notice neutral">
                          <ShieldCheck size={16} />
                          <span>
                            Compared with available public sources. Source
                            qualifications are listed in the Sources tab.
                          </span>
                        </div>
                      )}
                      <article className="markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: (props) => (
                              <a {...props} target="_blank" rel="noreferrer" />
                            ),
                          }}
                        >
                          {problem.description.replace(/^# .+\n/, "")}
                        </ReactMarkdown>
                      </article>
                    </>
                  )}
                  {tab === "Notes" && (
                    <>
                      <h2>Notes & approach</h2>
                      <p className="muted">Saved automatically.</p>
                      <textarea
                        className="notes-editor"
                        aria-label="Problem notes"
                        placeholder="Add notes…"
                        value={notes}
                        onChange={(e) => updateNotes(e.target.value)}
                      />
                    </>
                  )}
                  {tab === "Solutions" && (
                    <>
                      <h2>Saved work & solutions</h2>
                      <p className="muted">
                        Every original implementation is preserved. Opening one
                        won’t replace your editor.
                      </p>
                      <div className="artifact-list">
                        {problem.artifacts
                          .filter(
                            (a) =>
                              /\.py$|\.cpp$/.test(a.path) &&
                              !a.path.includes("test"),
                          )
                          .map((a) => (
                            <button
                              key={a.id}
                              onClick={async () =>
                                setFile(await api("/artifacts/" + a.id))
                              }
                            >
                              <FileCode2 size={16} />
                              <span>{a.path}</span>
                              <ArrowUpRight size={14} />
                            </button>
                          ))}
                      </div>
                      <h3>Run & submission history</h3>
                      {!problem.submissions.length && (
                        <p className="muted">
                          Your runs and submitted solutions will appear here.
                        </p>
                      )}
                      {problem.submissions.map((s) => (
                        <button
                          className="history-item"
                          key={s.id}
                          onClick={async () => {
                            setResult(s.result);
                            setCaseTab("Results");
                            setFile(await api("/submissions/" + s.id));
                          }}
                        >
                          <StatusIcon
                            status={s.result.accepted ? "solved" : "attempted"}
                          />
                          <span>
                            {s.mode === "submit" ? "Submission" : "Run"} #{s.id}
                            <small>
                              {s.language === "python" ? "Python 3" : "C++20"} ·{" "}
                              {s.created}
                            </small>
                          </span>
                          <strong>
                            {s.result.passed}/{s.result.total}
                          </strong>
                        </button>
                      ))}
                    </>
                  )}
                  {tab === "Sources" && (
                    <>
                      <h2>Sources & verification</h2>
                      <div className="audit-status">
                        <ShieldCheck size={20} />
                        <div>
                          <strong>
                            {problem.verification.status === "manual"
                              ? "Manual verification needed"
                              : "Source reviewed"}
                          </strong>
                          <small>
                            {problem.verification.checked ||
                              "No source comparison available"}
                          </small>
                        </div>
                      </div>
                      {problem.source && (
                        <a
                          className="source-link"
                          href={problem.source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open source question <ExternalLink size={14} />
                        </a>
                      )}
                      <article className="markdown">
                        {problem.verification.notes?.map((n, i) => (
                          <p key={i}>{n}</p>
                        ))}
                        <h3>Corrections & qualifications</h3>
                        {problem.verification.corrections?.length ? (
                          problem.verification.corrections.map((n, i) => (
                            <p key={i}>{n}</p>
                          ))
                        ) : (
                          <p>No requirements were changed during migration.</p>
                        )}
                        {problem.verification.manual?.length > 0 && (
                          <>
                            <h3>Still needs review</h3>
                            {problem.verification.manual.map((n, i) => (
                              <p key={i}>{n}</p>
                            ))}
                          </>
                        )}
                      </article>
                      <h3>Original files</h3>
                      <div className="artifact-list">
                        {problem.artifacts.map((a) => (
                          <button
                            key={a.id}
                            onClick={async () =>
                              setFile(await api("/artifacts/" + a.id))
                            }
                          >
                            <FileText size={15} />
                            <span>{a.path}</span>
                            <ArrowUpRight size={14} />
                          </button>
                        ))}
                      </div>
                      <a
                        className="secondary download"
                        href={apiPath(`/problems/${problem.id}/export`)}
                        download
                      >
                        <Download size={15} />
                        Export problem, tests & work
                      </a>
                    </>
                  )}
                </div>
              </section>
              <div
                className="resize-handle vertical"
                role="separator"
                aria-label="Resize problem and editor panels"
                onPointerDown={(e) => drag("split", e)}
              >
                <i />
              </div>
              <div
                className="right-workspace"
                ref={right}
                style={{
                  gridTemplateRows: `minmax(160px,${100 - lower}fr) 7px minmax(150px,${lower}fr)`,
                }}
              >
                <section className="editor-panel">
                  <div className="editor-toolbar">
                    <div>
                      <Code2 size={15} />
                      <span>Code</span>
                      <span className="editor-filename">
                        {language === "python" ? "main.py" : "main.cpp"}
                      </span>
                    </div>
                    <div>
                      <Select
                        label="Programming language"
                        value={language}
                        onChange={changeLanguage}
                        options={problem.languages}
                        labels={{ python: "Python 3", cpp: "C++20" }}
                      />
                      <button
                        className="icon-button"
                        aria-label="Reset to starter code"
                        title="Reset to original starter"
                        onClick={() => setModal({ type: "reset" })}
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="monaco-container">
                    <Editor
                      language={language === "python" ? "python" : "cpp"}
                      value={code}
                      onChange={changeCode}
                      theme="prep"
                      loading={
                        <div className="loading">
                          <Loader2 className="spin" />
                          Loading editor…
                        </div>
                      }
                      options={{
                        fontSize: 13,
                        fontFamily:
                          '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                        minimap: { enabled: false },
                        padding: { top: 20, bottom: 12 },
                        lineNumbersMinChars: 3,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: "on",
                        smoothScrolling: true,
                        renderLineHighlight: "line",
                        bracketPairColorization: { enabled: true },
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                      }}
                    />
                  </div>
                  <div className="editor-status">
                    <span>
                      <span className="live-dot" />
                      {saveState}
                    </span>
                    <span>
                      UTF-8 <span>•</span>{" "}
                      {language === "python" ? "Python 3" : "C++20"}{" "}
                      <span>•</span> ⌘ Enter to run
                    </span>
                  </div>
                </section>
                <div
                  className="resize-handle horizontal"
                  role="separator"
                  aria-label="Resize editor and test panels"
                  onPointerDown={(e) => drag("lower", e)}
                >
                  <i />
                </div>
                <section className="test-panel">
                  <div className="test-panel-heading">
                    <div className="panel-tabs">
                      {["Test cases", "Results"].map((t) => (
                        <button
                          key={t}
                          className={caseTab === t ? "selected" : ""}
                          onClick={() => setCaseTab(t)}
                        >
                          {t === "Test cases" ? (
                            <FlaskConical size={14} />
                          ) : (
                            <Terminal size={14} />
                          )}{" "}
                          {t}
                          {t === "Test cases" && (
                            <span>{problem.cases.length}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div>
                      <button
                        className="icon-button"
                        aria-label="Import test cases"
                        title="Import JSON test cases"
                        onClick={() => inputRef.current.click()}
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Add test case"
                        title="Add a visible test"
                        onClick={() => setModal({ type: "case" })}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {caseTab === "Results" ? (
                    <div className="results-scroll">
                      {running ? (
                        <div className="run-loading">
                          <Loader2 size={22} className="spin" />
                          <strong>
                            Running{" "}
                            {runningMode === "submit"
                              ? "the full visible suite"
                              : "selected tests"}
                            …
                          </strong>
                        </div>
                      ) : result ? (
                        <>
                          <div
                            className={
                              "verdict " + (result.accepted ? "pass" : "fail")
                            }
                          >
                            <span>
                              {result.accepted ? (
                                <CheckCircle2 size={20} />
                              ) : (
                                <AlertCircle size={20} />
                              )}
                              <strong>
                                {result.accepted
                                  ? "All tests passed"
                                  : "Review your results"}
                              </strong>
                            </span>
                            <span>
                              {result.passed} / {result.total} passed
                            </span>
                          </div>
                          <div className="result-summary">
                            {result.language === "cpp" ? "C++20" : "Python 3"}
                            <span>•</span>
                            {result.mode === "submit"
                              ? "Complete suite"
                              : "Run results"}
                          </div>
                          {result.results.map((r) => (
                            <ResultRow
                              key={r.id}
                              r={r}
                              onInspect={() => {
                                setActiveCase(r.id);
                                setCaseTab("Test cases");
                              }}
                            />
                          ))}
                        </>
                      ) : (
                        <div className="empty-state compact">
                          <Terminal size={25} />
                          <h3>No results</h3>
                          <p>Run a test case to see results.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="case-layout">
                      <div className="case-list">
                        <label className="case-search">
                          <Search size={13} />
                          <input
                            aria-label="Search test cases"
                            placeholder="Find a test…"
                            value={caseSearch}
                            onChange={(e) => setCaseSearch(e.target.value)}
                          />
                        </label>
                        {visibleCases.map((c, i) => {
                          const r = result?.results.find((r) => r.id === c.id);
                          return (
                            <button
                              key={c.id}
                              className={
                                "case-item " +
                                (activeCase === c.id ? "selected" : "")
                              }
                              onClick={() => setActiveCase(c.id)}
                            >
                              <span
                                className={
                                  r?.status === "passed"
                                    ? "case-pass"
                                    : r
                                      ? "case-fail"
                                      : "case-neutral"
                                }
                              >
                                {r?.status === "passed" ? (
                                  <Check size={12} />
                                ) : r ? (
                                  <X size={12} />
                                ) : (
                                  String(i + 1).padStart(2, "0")
                                )}
                              </span>
                              <span>
                                {c.name}
                                <small>{provenance(c)}</small>
                              </span>
                              <ChevronRight size={12} />
                            </button>
                          );
                        })}
                      </div>
                      <div className="case-detail">
                        {caseData ? (
                          <>
                            <div className="case-detail-header">
                              <div>
                                <h3>{caseData.name}</h3>
                                <span
                                  className={
                                    "origin-label " +
                                    (caseData.sourceVerified ? "verified" : "")
                                  }
                                >
                                  {caseData.sourceVerified ? (
                                    <ShieldCheck size={12} />
                                  ) : (
                                    <FileText size={12} />
                                  )}{" "}
                                  {provenance(caseData)}
                                </span>
                              </div>
                              <div>
                                <button
                                  className="icon-button"
                                  aria-label="Edit test case"
                                  title="Edit test"
                                  onClick={() =>
                                    setModal({ type: "case", case: caseData })
                                  }
                                >
                                  <NotebookPen size={14} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label="Delete test case"
                                  title="Delete test"
                                  onClick={() =>
                                    setModal({ type: "delete", case: caseData })
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {caseData.contractScope && (
                              <p className="native-note">
                                {caseData.contractScope}
                              </p>
                            )}
                            {caseData.kind !== "function" && (
                              <p className="native-note">
                                Original Python assertion test. The source below
                                contains its inputs and expected outputs.
                              </p>
                            )}
                            <CaseValue
                              title={
                                caseData.kind === "function"
                                  ? "Input · positional arguments"
                                  : "Input & assertions · Python source"
                              }
                              value={caseData.input}
                              raw={caseData.kind !== "function"}
                            />
                            <CaseValue
                              title="Expected output"
                              value={caseData.expected}
                            />
                            {caseData.preserveInput && (
                              <p className="native-note">
                                Additional original assertion: argument{" "}
                                {caseData.preserveInput
                                  .map((i) => i + 1)
                                  .join(", ")}{" "}
                                must remain unchanged after the call.
                              </p>
                            )}
                            {caseData.growthInput && (
                              <details className="growth-details">
                                <summary>
                                  Visible performance comparison ·{" "}
                                  {caseData.growthFactor}× growth limit
                                </summary>
                                <p className="native-note">
                                  This case also runs the smaller workload
                                  below. Large-workload runtime must be below{" "}
                                  {caseData.growthFactor} times the greater of
                                  its runtime and {caseData.growthFloorMs} ms.
                                </p>
                                <CaseValue
                                  title="Smaller workload input"
                                  value={caseData.growthInput}
                                />
                                <CaseValue
                                  title="Smaller workload expected output"
                                  value={caseData.growthExpected}
                                />
                              </details>
                            )}
                            {currentResult && (
                              <>
                                <div
                                  className={
                                    "actual-heading " +
                                    (currentResult.status === "passed"
                                      ? "pass"
                                      : "fail")
                                  }
                                >
                                  {currentResult.status.replaceAll("_", " ")}
                                  <span>
                                    {currentResult.timeMs?.toFixed(2)} ms{" "}
                                    {currentResult.memoryKb != null &&
                                      `· ${(currentResult.memoryKb / 1024).toFixed(1)} MB`}
                                  </span>
                                </div>
                                <CaseValue
                                  title="Actual output"
                                  value={currentResult.actual}
                                />
                                {currentResult.error && (
                                  <pre className="error-output">
                                    {currentResult.error}
                                  </pre>
                                )}
                                {currentResult.stdout && (
                                  <CaseValue
                                    title="Console output"
                                    value={currentResult.stdout}
                                    raw
                                  />
                                )}
                              </>
                            )}
                            <div className="case-detail-footer">
                              <span>
                                <Clock size={12} />
                                {caseData.timeout || 8}s limit
                              </span>
                              <button
                                className="secondary"
                                disabled={running}
                                onClick={() => run("run", [activeCase])}
                              >
                                <Play size={12} />
                                Run this case
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="loading">
                            {activeCase ? (
                              <Loader2 size={18} className="spin" />
                            ) : (
                              "Add a test to get started."
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          try {
            let list = JSON.parse(await f.text());
            if (list.cases) list = list.cases;
            await send(`/problems/${problem.id}/cases`, list, "POST");
            await reloadCases();
          } catch (e) {
            setError(e.message);
          }
          e.target.value = "";
        }}
      />
      {file && (
        <div className="modal-backdrop" onClick={() => setFile(null)}>
          <div
            className="modal file-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <small>
                  {file.type === "submission"
                    ? "SAVED SUBMISSION"
                    : "ORIGINAL FILE · PRESERVED"}
                </small>
                <h2>{file.path}</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Close original file"
                onClick={() => setFile(null)}
              >
                <X size={19} />
              </button>
            </div>
            <pre className="file-content">{file.content}</pre>
            <div className="modal-footer">
              <small>SHA-256: {file.hash.slice(0, 20)}…</small>
              <button
                className="secondary"
                onClick={async () => {
                  await loadSaved(file.content, file.language || language);
                  setFile(null);
                }}
              >
                Load into editor
              </button>
            </div>
          </div>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div
            className={
              "modal " + (modal.type === "migration" ? "migration-modal" : "")
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>
                {
                  {
                    reset: "Reset your code?",
                    delete: "Delete this test?",
                    case: modal.case
                      ? "Edit visible test"
                      : "Add a visible test",
                    migration: "Import report",
                  }[modal.type]
                }
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            {modal.type === "reset" ? (
              <>
                <p>
                  Replace the editor with the starter template for{" "}
                  {language === "python" ? "Python" : "C++"}. Previous submitted
                  solutions remain in your history.
                </p>
                <div className="modal-footer">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Keep coding
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      changeCode(problem.starters[language]);
                      setModal(null);
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset code
                  </button>
                </div>
              </>
            ) : modal.type === "delete" ? (
              <>
                <p>
                  Remove “{modal.case.name}” from your active suite. Its
                  original source remains preserved; repeat imports will respect
                  this deletion.
                </p>
                <div className="modal-footer">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button
                    className="danger"
                    onClick={async () => {
                      await api(
                        `/problems/${problem.id}/cases/${modal.case.id}`,
                        { method: "DELETE" },
                      );
                      await reloadCases();
                      setModal(null);
                    }}
                  >
                    Delete test
                  </button>
                </div>
              </>
            ) : modal.type === "case" ? (
              <CaseForm
                item={modal.case}
                onSave={async (value) => {
                  try {
                    const saved = await send(
                      `/problems/${problem.id}/cases${modal.case ? "/" + modal.case.id : ""}`,
                      value,
                      modal.case ? "PUT" : "POST",
                    );
                    await reloadCases(modal.case ? saved.id : saved[0].id);
                    setModal(null);
                  } catch (e) {
                    throw e;
                  }
                }}
              />
            ) : (
              <MigrationReport library={library} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function Select({ value, onChange, options, labels = {}, label }) {
  return (
    <label className="select-wrap">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {labels[v] || v}
          </option>
        ))}
      </select>
      <ChevronDown size={12} />
    </label>
  );
}
function StatusIcon({ status }) {
  return status === "solved" ? (
    <CheckCircle2 size={17} className="status-solved" />
  ) : status === "attempted" ? (
    <span className="status-attempted" title="In progress" />
  ) : (
    <span className="status-todo" title="Not started" />
  );
}
function CaseValue({ title, value, raw }) {
  const [expanded, setExpanded] = useState(false);
  const text = raw ? String(value) : pretty(value);
  const long = text?.length > 20000;
  return (
    <div className="case-value">
      <div className="case-value-label">
        {title}
        {long && (
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "Show full value"}
          </button>
        )}
      </div>
      <pre>
        {long && !expanded
          ? text.slice(0, 20000) +
            "\n… Display shortened. Click “Show full value” to inspect everything."
          : (text ?? "No result returned")}
      </pre>
    </div>
  );
}
function ResultRow({ r, onInspect }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={"result-row " + (r.status === "passed" ? "passed" : "failed")}
    >
      <button className="result-row-title" onClick={() => setOpen(!open)}>
        <ChevronRight
          size={13}
          style={{ transform: open ? "rotate(90deg)" : "" }}
        />
        {r.status === "passed" ? (
          <CheckCircle2 size={14} />
        ) : (
          <AlertCircle size={14} />
        )}
        <strong>{r.name}</strong>
        <span>{r.status.replaceAll("_", " ")}</span>
        <small>
          {r.timeMs?.toFixed(1)} ms
          {r.memoryKb != null && ` · ${(r.memoryKb / 1024).toFixed(1)} MB`}
        </small>
      </button>
      {open && (
        <div className="result-row-details">
          <CaseValue title="Actual output" value={r.actual} />
          {r.error && <pre className="error-output">{r.error}</pre>}
          {r.stdout && <CaseValue title="Console" value={r.stdout} raw />}
          <button className="text-button" onClick={onInspect}>
            Inspect input & expected output
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
function CaseForm({ item, onSave }) {
  const [name, setName] = useState(item?.name || ""),
    [input, setInput] = useState(
      item?.kind && item.kind !== "function"
        ? item.input
        : pretty(item?.input || [[]]),
    ),
    [expected, setExpected] = useState(pretty(item?.expected ?? null)),
    [limit, setLimit] = useState(item?.timeout || 8),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave({
            name,
            input:
              item?.kind && item.kind !== "function"
                ? input
                : JSON.parse(input),
            expected: JSON.parse(expected),
            timeout: Number(limit),
            kind: item?.kind || "function",
          });
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="muted">
        Tests are always visible. Editing an original case marks your version as
        user-edited.
      </p>
      <label className="field-label">
        Test name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. all negative numbers"
        />
      </label>
      <label className="field-label">
        {item?.kind && item.kind !== "function"
          ? "Python test source"
          : "Input · JSON array of positional arguments"}
        <textarea
          required
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
        />
      </label>
      <label className="field-label">
        Expected output · JSON
        <textarea
          required
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          spellCheck={false}
        />
      </label>
      <label className="field-label inline">
        Time limit (seconds)
        <input
          type="number"
          min="0.1"
          max="30"
          step="0.1"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-footer">
        <button className="primary" disabled={busy} type="submit">
          <Check size={15} />
          Save test case
        </button>
      </div>
    </form>
  );
}
function MigrationReport({ library }) {
  const [report, setReport] = useState(null);
  useEffect(() => {
    api("/migration").then(setReport);
  }, []);
  return (
    <div className="migration-content">
      <div className="migration-banner">
        <ShieldCheck size={28} />
        <div>
          <h3>All original files preserved.</h3>
          <p>Imports are additive, repeatable, and safe for saved work.</p>
        </div>
      </div>
      {report && (
        <>
          <div className="migration-stats">
            <span>
              <strong>{report.folders}</strong>source folders
            </span>
            <span>
              <strong>{report.uniqueProblems}</strong>unique problems
            </span>
            <span>
              <strong>{report.totalCases}</strong>visible test entries
            </span>
            <span>
              <strong>{report.artifacts}</strong>preserved files
            </span>
          </div>
          <h3>Consolidated duplicates</h3>
          {report.duplicates.map((d, i) => (
            <p key={i}>
              <strong>{d.folder}</strong>
              <br />
              {d.reason}
            </p>
          ))}
          <h3>FastPrep source comparison</h3>
          <p>
            All 16 linked public questions were compared on October 17, 2026.
            Qualifications and corrections appear in each problem’s Sources tab.
            Interview-report adapters are identified explicitly.
          </p>
          <h3>Manual review & source limits</h3>
          {library
            .filter(
              (p) =>
                p.verification.status === "manual" ||
                p.verification.manual?.length,
            )
            .map((p) => (
              <div className="audit-entry" key={p.id}>
                <strong>{p.title}</strong>
                <p>
                  {p.verification.manual?.join(" ") ||
                    p.verification.notes?.join(" ")}
                </p>
              </div>
            ))}
          <h3>Import another folder</h3>
          <pre className="command-block">
            cd platform{`\n`}npm run import{`\n`}# or: python3
            scripts/import_problems.py --root /path/to/problems
          </pre>
          <p className="muted">
            The full import inventory is saved in
            platform/data/migration-report.json. Source files and test
            generators are available in each problem’s Sources tab.
          </p>
        </>
      )}
    </div>
  );
}
function AccessGate() {
  const [state, setState] = useState("loading"),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState(false);
  useEffect(() => {
    api("/auth/session")
      .then((s) => setState(s.authenticated ? "ready" : "locked"))
      .catch((e) => {
        setError(e.message);
        setState("locked");
      });
    const expired = () => setState("locked");
    window.addEventListener("prep:expired", expired);
    return () => window.removeEventListener("prep:expired", expired);
  }, []);
  if (state === "ready") return <App />;
  if (state === "loading")
    return (
      <div className="access-page">
        <Loader2 className="spin" aria-label="Loading" />
      </div>
    );
  return (
    <div className="access-page">
      <form
        className="access-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setPending(true);
          try {
            await send("/auth/login", { password }, "POST");
            setPassword("");
            setState("ready");
          } catch (e) {
            setError(e.message);
          } finally {
            setPending(false);
          }
        }}
      >
        <Code2 size={30} />
        <h1>davidprep</h1>
        <label className="field-label">
          Password
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="primary" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="access-note">This browser will stay signed in.</p>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<AccessGate />);
