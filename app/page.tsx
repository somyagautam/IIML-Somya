 "use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Status = "Not started" | "In progress" | "Blocked" | "Completed";
type Priority = "Low" | "Medium" | "High";
type Task = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "taskflow-tasks-v1";
const emptyForm = {
  title: "", description: "", startDate: "", dueDate: "",
  priority: "Medium" as Priority, status: "Not started" as Status, progress: 0
};

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function prettyDate(value: string) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function isOverdue(task: Task) {
  return !!task.dueDate && task.dueDate < todayISO() && task.status !== "Completed";
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch { /* Ignore invalid local data and start with an empty list. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === "In progress").length,
    completed: tasks.filter(t => t.status === "Completed").length,
    overdue: tasks.filter(isOverdue).length
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks
    .filter(t => {
      const matchesQuery = `${t.title} ${t.description}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "All" || (filter === "Overdue" ? isOverdue(t) : t.status === filter);
      return matchesQuery && matchesFilter;
    })
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }), [tasks, query, filter]);

  function startNew() {
    setEditingId(null);
    setForm({ ...emptyForm, startDate: todayISO() });
    setShowForm(true);
  }
  function editTask(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title, description: task.description, startDate: task.startDate,
      dueDate: task.dueDate, priority: task.priority, status: task.status, progress: task.progress
    });
    setShowForm(true);
  }
  function submitTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      alert("Due date cannot be earlier than the start date.");
      return;
    }
    const now = new Date().toISOString();
    if (editingId) {
      setTasks(current => current.map(t => t.id === editingId
        ? { ...t, ...form, title: form.title.trim(), updatedAt: now }
        : t));
    } else {
      setTasks(current => [{ ...form, title: form.title.trim(), id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...current]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }
  function updateProgress(task: Task, value: number) {
    const progress = Math.max(0, Math.min(100, value));
    const status: Status = progress === 100 ? "Completed" : progress > 0 ? "In progress" : task.status === "Completed" ? "Not started" : task.status;
    setTasks(current => current.map(t => t.id === task.id ? { ...t, progress, status, updatedAt: new Date().toISOString() } : t));
  }
  function updateStatus(task: Task, status: Status) {
    setTasks(current => current.map(t => t.id === task.id
      ? { ...t, status, progress: status === "Completed" ? 100 : status === "Not started" ? 0 : t.progress, updatedAt: new Date().toISOString() }
      : t));
  }
  function deleteTask(id: string) {
    if (confirm("Delete this task? This cannot be undone.")) setTasks(current => current.filter(t => t.id !== id));
  }
  function exportTasks() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `taskflow-backup-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function importTasks(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed) || parsed.some(t => !t.id || !t.title)) throw new Error("Invalid file");
        if (confirm(`Import ${parsed.length} tasks? Existing tasks will be replaced.`)) setTasks(parsed);
      } catch { alert("This file is not a valid Taskflow JSON backup."); }
      if (importRef.current) importRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">✓</span><span>taskflow</span></a>
        <div className="top-actions">
          <button className="button button-quiet" onClick={() => importRef.current?.click()}>↑ <span>Import backup</span></button>
          <button className="button button-quiet" onClick={exportTasks}>↓ <span>Export backup</span></button>
          <button className="button button-primary" onClick={startNew}>＋ <span>New task</span></button>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Make progress, <span>one task at a time.</span></h1>
          <p className="subtitle">A clear view of what needs doing, what’s moving, and what’s done.</p>
        </div>
        <div className="today-pill"><span className="live-dot" /> {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
      </section>

      <section className="stats-grid" aria-label="Task summary">
        <Stat label="Total tasks" value={stats.total} detail="In your workspace" icon="▤" />
        <Stat label="In progress" value={stats.active} detail="Currently moving" icon="◷" />
        <Stat label="Completed" value={stats.completed} detail="Across all tasks" icon="✓" />
        <Stat label="Overdue" value={stats.overdue} detail="Need your attention" icon="!" alert={stats.overdue > 0} />
      </section>

      <section className="tasks-section">
        <div className="section-heading">
          <div><p className="eyebrow">TASK OVERVIEW</p><h2>Your tasks <span className="count">{tasks.length}</span></h2></div>
          <button className="button button-primary desktop-add" onClick={startNew}>＋ New task</button>
        </div>
        <div className="toolbar">
          <div className="search-box"><span>⌕</span><input aria-label="Search tasks" placeholder="Search tasks..." value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="filter-wrap">
            <label htmlFor="filter">Show</label>
            <select id="filter" value={filter} onChange={e => setFilter(e.target.value)}>
              {["All", "Not started", "In progress", "Blocked", "Completed", "Overdue"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {!ready ? <div className="empty-state">Loading your workspace…</div> :
          visibleTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>{tasks.length === 0 ? "A fresh start." : "No matching tasks."}</h3>
              <p>{tasks.length === 0 ? "Add your first task and give your plans a timeline." : "Try a different search or filter."}</p>
              {tasks.length === 0 && <button className="button button-primary" onClick={startNew}>＋ Create your first task</button>}
            </div>
          ) : (
            <div className="task-list">
              {visibleTasks.map(task => <article className="task-card" key={task.id}>
                <div className="task-main">
                  <div className="task-title-line">
                    <h3>{task.title}</h3>
                    <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority} priority</span>
                  </div>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="task-meta">
                    <span>◷ {prettyDate(task.startDate)} – {prettyDate(task.dueDate)}</span>
                    {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
                    <span className={`status status-${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span>
                  </div>
                </div>
                <div className="progress-area">
                  <div className="progress-label"><span>Progress</span><strong>{task.progress}%</strong></div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${task.progress}%` }} /></div>
                  <input className="progress-slider" aria-label={`Progress for ${task.title}`} type="range" min="0" max="100" step="5" value={task.progress} onChange={e => updateProgress(task, Number(e.target.value))} />
                </div>
                <div className="task-actions">
                  <select aria-label={`Status for ${task.title}`} value={task.status} onChange={e => updateStatus(task, e.target.value as Status)}>
                    {["Not started", "In progress", "Blocked", "Completed"].map(v => <option key={v}>{v}</option>)}
                  </select>
                  <button className="icon-button" aria-label={`Edit ${task.title}`} title="Edit task" onClick={() => editTask(task)}>✎</button>
                  <button className="icon-button delete" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => deleteTask(task.id)}>×</button>
                </div>
              </article>)}
            </div>
          )
        }
      </section>

      <footer><span>taskflow</span> · Keep your next step in sight. <span className="storage-note">Saved in this browser</span></footer>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <form className="task-modal" onSubmit={submitTask}>
          <div className="modal-heading"><div><p className="eyebrow">{editingId ? "UPDATE DETAILS" : "ADD TO YOUR PLAN"}</p><h2>{editingId ? "Edit task" : "Create a task"}</h2></div><button type="button" className="close-button" onClick={() => setShowForm(false)}>×</button></div>
          <label className="field full">Task name<input autoFocus required maxLength={100} placeholder="e.g. Prepare project proposal" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
          <label className="field full">Description <span className="optional">Optional</span><textarea rows={3} placeholder="Add a few details about this task..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <div className="form-grid">
            <label className="field">Start date<input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
            <label className="field">Due date<input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></label>
            <label className="field">Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label className="field">Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}><option>Not started</option><option>In progress</option><option>Blocked</option><option>Completed</option></select></label>
          </div>
          <label className="field full">Progress <strong className="progress-value">{form.progress}%</strong><input className="modal-range" type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value), status: Number(e.target.value) === 100 ? "Completed" : Number(e.target.value) > 0 ? "In progress" : "Not started" })} /></label>
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button button-primary">{editingId ? "Save changes" : "Create task"}</button></div>
        </form>
      </div>}
      <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importTasks} />
    </main>
  );
}

function Stat({ label, value, detail, icon, alert = false }: { label: string; value: number; detail: string; icon: string; alert?: boolean }) {
  return <div className={`stat-card ${alert ? "stat-alert" : ""}`}><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}
