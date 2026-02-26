import { useState, useEffect, useRef, useCallback } from "react";

// ─── Google Fonts ──────────────────────────────────────────────────────────────
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap";
document.head.appendChild(link);

const globalCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0f14;
    --surface: #13161e;
    --surface2: #1a1e2a;
    --border: #252836;
    --accent: #f5a623;
    --accent2: #e8855a;
    --text: #eceef5;
    --text2: #8a90a8;
    --text3: #525870;
    --green: #4ade80;
    --red: #f87171;
    --blue: #60a5fa;
    --purple: #a78bfa;
    --radius: 14px;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }
  html, body, #root { height: 100%; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  input, textarea, select, button { font-family: var(--font-body); }
`;
const styleEl = document.createElement("style");
styleEl.textContent = globalCss;
document.head.appendChild(styleEl);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();
const LS_KEYS = { goals: "sf:goals", importants: "sf:importants", images: "sf:images", notes: "sf:notes", streak: "sf:streak", config: "sf:config" };

const lsGet = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const extractTitle = (html) => {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m ? m[1].trim() : "Untitled Note";
};
const extractSnippet = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").replace(/\s+/g, " ").trim().slice(0, 140) + "…";
};

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 18, color = "currentColor", sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) =>
      typeof p === "string" ? <path key={i} d={p} /> :
      p.r ? <circle key={i} cx={p.cx} cy={p.cy} r={p.r} /> :
      <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx || 0} />
    )}
  </svg>
);

const I = {
  home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  thread: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  notes: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  search: [{ cx: "11", cy: "11", r: "8" }, "M21 21l-4.35-4.35"],
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"],
  img: ["M21 15l-5-5L5 20", {x:"3",y:"3",w:"18",h:"18",rx:"2"}, { cx: "8.5", cy: "8.5", r: "1.5" }],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  x: "M18 6L6 18M6 6l12 12",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  fire: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z",
  book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  settings: ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", { cx: "12", cy: "12", r: "3" }],
  github: ["M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"],
  back: "M15 18l-6-6 6-6",
};

// ─── Primitive UI ──────────────────────────────────────────────────────────────
const Badge = ({ label, color = "var(--accent)" }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: "var(--font-head)", letterSpacing: ".03em", flexShrink: 0 }}>{label}</span>
);

function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: "var(--surface)", border: `1px solid ${hov && onClick ? "var(--accent)44" : "var(--border)"}`, borderRadius: "var(--radius)", padding: 20, transition: "all .2s", transform: hov && onClick ? "translateY(-2px)" : "none", boxShadow: hov && onClick ? "0 8px 32px #00000044" : "none", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) {
  const [hov, setHov] = useState(false);
  const pad = { sm: "7px 14px", md: "10px 20px", lg: "13px 26px" }[size];
  const fs = { sm: 13, md: 14, lg: 16 }[size];
  const vs = {
    primary: { background: hov ? "#f0951a" : "var(--accent)", color: "#000" },
    ghost: { background: hov ? "var(--surface2)" : "transparent", color: "var(--text)", border: "1px solid var(--border)" },
    danger: { background: hov ? "#ef4444" : "var(--red)", color: "#fff", border: "none" },
    subtle: { background: hov ? "var(--surface2)" : "transparent", color: "var(--text2)", border: "none" },
    green: { background: hov ? "#22c55e" : "var(--green)", color: "#000", border: "none" },
  }[variant] || {};
  return (
    <button disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ padding: pad, fontSize: fs, border: "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, transition: "all .15s", fontWeight: 500, opacity: disabled ? .5 : 1, ...vs, ...style }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, style = {}, type = "text", onKeyDown }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", transition: "border .2s", ...style }}
      onFocus={e => e.target.style.borderColor = "var(--accent)"}
      onBlur={e => e.target.style.borderColor = "var(--border)"} />
  );
}

// ─── Setup Modal ───────────────────────────────────────────────────────────────
function SetupModal({ config, onSave }) {
  const [owner, setOwner] = useState(config.owner || "");
  const [repo, setRepo] = useState(config.repo || "");
  const [branch, setBranch] = useState(config.branch || "main");
  const [folder, setFolder] = useState(config.folder || "notes");

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent)22", border: "1px solid var(--accent)44", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic d={I.github} size={20} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18 }}>Connect GitHub Repo</h2>
            <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Your HTML notes will be loaded from this repo</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>GitHub Username</label>
            <Input value={owner} onChange={setOwner} placeholder="e.g. johndoe" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Repository Name</label>
            <Input value={repo} onChange={setRepo} placeholder="e.g. my-study-notes" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Branch</label>
              <Input value={branch} onChange={setBranch} placeholder="main" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>Notes Folder</label>
              <Input value={folder} onChange={setFolder} placeholder="notes" />
            </div>
          </div>
        </div>

        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
          📁 Your HTML files should live at:<br />
          <code style={{ color: "var(--accent)", fontSize: 11 }}>
            github.com/{owner || "username"}/{repo || "repo"}/{folder || "notes"}/*.html
          </code>
        </div>

        <Btn onClick={() => onSave({ owner, repo, branch, folder })} disabled={!owner || !repo} style={{ width: "100%" }} size="lg">
          <Ic d={I.check} size={16} />Save & Load Notes
        </Btn>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardPage({ goals, setGoals, importants, setImportants, images, setImages, streak, setStreak }) {
  const [newGoal, setNewGoal] = useState("");
  const [newImp, setNewImp] = useState("");
  const fileRef = useRef();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayGoals = goals.filter(g => (g.date || "").startsWith(todayStr));
  const doneCount = todayGoals.filter(g => g.done).length;

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const updated = [...goals, { id: uid(), text: newGoal.trim(), done: false, date: now() }];
    setGoals(updated);
    lsSet(LS_KEYS.goals, updated);
    setNewGoal("");
  };
  const toggleGoal = (id) => {
    const updated = goals.map(g => g.id === id ? { ...g, done: !g.done } : g);
    setGoals(updated);
    lsSet(LS_KEYS.goals, updated);
  };
  const removeGoal = (id) => { const u = goals.filter(g => g.id !== id); setGoals(u); lsSet(LS_KEYS.goals, u); };

  const addImp = () => {
    if (!newImp.trim()) return;
    const updated = [...importants, { id: uid(), text: newImp.trim(), date: now() }];
    setImportants(updated);
    lsSet(LS_KEYS.importants, updated);
    setNewImp("");
  };
  const removeImp = (id) => { const u = importants.filter(x => x.id !== id); setImportants(u); lsSet(LS_KEYS.importants, u); };

  const handleImgUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => {
          const u = [...prev, { id: uid(), src: reader.result, name: file.name, date: now() }];
          lsSet(LS_KEYS.images, u);
          return u;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const greeting = ["Good Morning", "Good Afternoon", "Good Evening"][Math.floor(new Date().getHours() / 8)] || "Hello";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Header row */}
      <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>{greeting} 👋</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Day Streak 🔥", val: streak, color: "var(--accent)" },
            { label: "Done Today", val: `${doneCount}/${todayGoals.length}`, color: "var(--green)" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Goals */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ic d={I.fire} color="var(--accent)" size={18} />
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>Daily Goals</span>
          </div>
          {todayGoals.length > 0 && (
            <div style={{ background: "var(--surface2)", borderRadius: 20, height: 6, width: 80, overflow: "hidden" }}>
              <div style={{ background: "var(--green)", height: "100%", width: `${(doneCount / todayGoals.length) * 100}%`, transition: "width .4s", borderRadius: 20 }} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", marginBottom: 14 }}>
          {todayGoals.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>No goals yet — add one below!</p>}
          {todayGoals.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
              <button onClick={() => toggleGoal(g.id)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${g.done ? "var(--green)" : "var(--border)"}`, background: g.done ? "var(--green)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                {g.done && <Ic d={I.check} size={12} color="#000" sw={2.5} />}
              </button>
              <span style={{ flex: 1, fontSize: 13, textDecoration: g.done ? "line-through" : "none", color: g.done ? "var(--text3)" : "var(--text)" }}>{g.text}</span>
              <button onClick={() => removeGoal(g.id)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}><Ic d={I.x} size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={newGoal} onChange={setNewGoal} placeholder="Add a goal..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && addGoal()} />
          <Btn onClick={addGoal} size="sm"><Ic d={I.plus} size={14} />Add</Btn>
        </div>
      </Card>

      {/* Important Stuff */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Ic d={I.star} color="var(--accent2)" size={18} />
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>Important Stuff</span>
          <Badge label={importants.length} color="var(--accent2)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", marginBottom: 14 }}>
          {importants.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>Pin key reminders here.</p>}
          {importants.map((item, i) => (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ["var(--accent)", "var(--accent2)", "var(--blue)", "var(--purple)", "var(--green)"][i % 5], marginTop: 5, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>{item.text}</span>
              <button onClick={() => removeImp(item.id)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}><Ic d={I.x} size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input value={newImp} onChange={setNewImp} placeholder="Add important note..." style={{ flex: 1 }} onKeyDown={e => e.key === "Enter" && addImp()} />
          <Btn onClick={addImp} size="sm" variant="ghost"><Ic d={I.plus} size={14} />Pin</Btn>
        </div>
      </Card>

      {/* Visual Board */}
      <Card style={{ gridColumn: "1/-1" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ic d={I.img} color="var(--blue)" size={18} />
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>Visual Board</span>
            <Badge label={`${images.length} image${images.length !== 1 ? "s" : ""}`} color="var(--blue)" />
          </div>
          <Btn size="sm" variant="ghost" onClick={() => fileRef.current.click()}><Ic d={I.upload} size={14} />Upload</Btn>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImgUpload} />
        </div>
        {images.length === 0 ? (
          <div onClick={() => fileRef.current.click()}
            style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "36px 24px", textAlign: "center", color: "var(--text3)", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <Ic d={I.img} size={32} color="var(--text3)" />
            <p style={{ marginTop: 10, fontSize: 14 }}>Drop mind maps, diagrams, screenshots here</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
            {images.map(img => (
              <div key={img.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "4/3", background: "var(--surface2)" }}>
                <img src={img.src} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "#000a", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity .2s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <button onClick={() => { const u = images.filter(x => x.id !== img.id); setImages(u); lsSet(LS_KEYS.images, u); }}
                    style={{ background: "var(--red)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 10px", cursor: "pointer" }}>
                    <Ic d={I.trash} size={14} />
                  </button>
                </div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,#000a)", padding: "8px 8px 6px", fontSize: 10, color: "#fff", pointerEvents: "none" }}>{img.name.slice(0, 22)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Threads Page ───────────────────────────────────────────────────────────────
function ThreadsPage({ config, setPage: setMainPage }) {
  const [ghThreads, setGhThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [viewContent, setViewContent] = useState("");
  const [viewLoading, setViewLoading] = useState(false);

  const colors = ["var(--accent)", "var(--blue)", "var(--purple)", "var(--accent2)", "var(--green)"];

  const loadFromGitHub = useCallback(async () => {
    if (!config.owner || !config.repo) { setError("no_config"); return; }
    setLoading(true);
    setError("");
    try {
      const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.folder || "notes"}?ref=${config.branch || "main"}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const files = await res.json();
      const htmlFiles = files.filter(f => f.name.endsWith(".html") || f.name.endsWith(".htm"));
      setGhThreads(htmlFiles.map((f, i) => ({
        id: f.sha,
        name: f.name,
        title: f.name.replace(/\.(html|htm)$/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        rawUrl: f.download_url,
        date: now(),
        color: colors[i % colors.length],
        size: f.size,
      })));
    } catch (e) {
      setError(e.message.includes("404") ? "not_found" : e.message);
    } finally { setLoading(false); }
  }, [config]);

  useEffect(() => { loadFromGitHub(); }, [loadFromGitHub]);

  const openThread = async (thread) => {
    setViewing(thread);
    setViewLoading(true);
    try {
      const res = await fetch(thread.rawUrl);
      const html = await res.text();
      setViewContent(html);
    } catch { setViewContent("<p style='padding:20px;color:red'>Failed to load file.</p>"); }
    finally { setViewLoading(false); }
  };

  if (viewing) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Btn variant="ghost" size="sm" onClick={() => { setViewing(null); setViewContent(""); }}><Ic d={I.back} size={14} />Back</Btn>
          <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20 }}>{viewing.title}</h2>
          <Badge label={viewing.name} color={viewing.color} />
          <a href={viewing.rawUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: "var(--text3)", fontSize: 12, textDecoration: "none" }}>Open raw ↗</a>
        </div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {viewLoading
            ? <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>Loading…</div>
            : <iframe srcDoc={viewContent} style={{ width: "100%", height: "70vh", border: "none", borderRadius: "var(--radius)", background: "#fff" }} title={viewing.title} sandbox="allow-same-origin allow-scripts" />}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800 }}>GitHub Threads</h2>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 3 }}>
            HTML files from <code style={{ color: "var(--accent)", fontSize: 12 }}>{config.owner}/{config.repo}/{config.folder || "notes"}</code>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" size="sm" onClick={loadFromGitHub}><Ic d={I.refresh} size={14} />Refresh</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setMainPage("settings")}><Ic d={I.settings} size={14} />Configure</Btn>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Loading from GitHub…</p>
        </div>
      )}

      {!loading && error === "no_config" && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <Ic d={I.github} size={36} color="var(--text3)" />
          <p style={{ marginTop: 16, color: "var(--text2)", fontSize: 15, marginBottom: 20 }}>Connect your GitHub repo to load HTML notes</p>
          <Btn onClick={() => setMainPage("settings")}><Ic d={I.settings} size={15} />Configure GitHub Repo</Btn>
        </Card>
      )}

      {!loading && error && error !== "no_config" && (
        <Card style={{ borderColor: "var(--red)44", background: "var(--red)08", padding: "20px 24px" }}>
          <p style={{ color: "var(--red)", fontSize: 14, marginBottom: 12 }}>⚠️ {error === "not_found" ? `Folder '${config.folder || "notes"}' not found in ${config.owner}/${config.repo}. Make sure the folder exists and the repo is public.` : error}</p>
          <Btn variant="ghost" size="sm" onClick={loadFromGitHub}>Retry</Btn>
        </Card>
      )}

      {!loading && !error && ghThreads.length === 0 && (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 8 }}>No HTML files found in <code style={{ color: "var(--accent)" }}>{config.folder || "notes"}/</code></p>
          <p style={{ color: "var(--text3)", fontSize: 13 }}>Upload .html files to that folder in your GitHub repo, then click Refresh.</p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ghThreads.map(t => (
          <Card key={t.id} onClick={() => openThread(t)}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: t.color + "22", border: `1px solid ${t.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic d={I.thread} size={20} color={t.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>{t.title}</span>
                  <Badge label="HTML" color={t.color} />
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{(t.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openThread(t); }}><Ic d={I.eye} size={13} />View</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Notes Page ─────────────────────────────────────────────────────────────────
function NotesPage({ notes, setNotes }) {
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState({ title: "", body: "", tag: "study" });
  const [creating, setCreating] = useState(false);

  const tagColors = { study: "var(--blue)", todo: "var(--accent)", idea: "var(--purple)", review: "var(--accent2)", other: "var(--green)" };
  const tags = Object.keys(tagColors);

  const save = () => {
    if (!draft.title.trim()) return;
    let updated;
    if (active) {
      updated = notes.map(n => n.id === active.id ? { ...n, ...draft, updated: now() } : n);
    } else {
      updated = [{ id: uid(), ...draft, date: now(), updated: now() }, ...notes];
    }
    setNotes(updated);
    lsSet(LS_KEYS.notes, updated);
    setCreating(false);
    setActive(null);
    setDraft({ title: "", body: "", tag: "study" });
  };

  const open = (note) => { setActive(note); setDraft({ title: note.title, body: note.body, tag: note.tag }); setCreating(true); };
  const del = (id, e) => { e?.stopPropagation(); const u = notes.filter(n => n.id !== id); setNotes(u); lsSet(LS_KEYS.notes, u); };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800 }}>Quick Notes</h2>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 3 }}>Thoughts, references, and reminders</p>
        </div>
        <Btn onClick={() => { setCreating(true); setActive(null); setDraft({ title: "", body: "", tag: "study" }); }}>
          <Ic d={I.plus} size={15} />New Note
        </Btn>
      </div>

      {creating && (
        <Card style={{ marginBottom: 24, borderColor: "var(--accent)44" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <Input value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} placeholder="Note title..." style={{ flex: 1, fontWeight: 600 }} />
            <select value={draft.tag} onChange={e => setDraft(d => ({ ...d, tag: e.target.value }))}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "10px 12px", fontSize: 13, outline: "none" }}>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} placeholder="Write your note here..." rows={6}
            style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "12px 14px", fontSize: 14, fontFamily: "var(--font-body)", resize: "vertical", outline: "none", lineHeight: 1.7, marginBottom: 14 }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save}><Ic d={I.check} size={14} />{active ? "Update" : "Save"}</Btn>
            <Btn variant="ghost" onClick={() => { setCreating(false); setActive(null); }}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {notes.length === 0 && !creating && <p style={{ color: "var(--text3)", gridColumn: "1/-1", textAlign: "center", padding: 40, fontSize: 14 }}>No notes yet — create your first one!</p>}
        {notes.map(note => {
          const c = tagColors[note.tag] || "var(--text3)";
          return (
            <Card key={note.id} onClick={() => open(note)} style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: c, borderRadius: "14px 0 0 14px" }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{note.title}</span>
                {note.tag && <Badge label={note.tag} color={c} />}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.7, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{note.body || <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Empty note</span>}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>{fmt(note.updated || note.date)}</span>
                <button onClick={e => del(note.id, e)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", opacity: .5 }}>
                  <Ic d={I.trash} size={13} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────────────────────
function SettingsPage({ config, setConfig }) {
  const [owner, setOwner] = useState(config.owner || "");
  const [repo, setRepo] = useState(config.repo || "");
  const [branch, setBranch] = useState(config.branch || "main");
  const [folder, setFolder] = useState(config.folder || "notes");
  const [saved, setSaved] = useState(false);

  const save = () => {
    const c = { owner, repo, branch, folder };
    setConfig(c);
    lsSet(LS_KEYS.config, c);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Settings</h2>
      <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 28 }}>Configure where your HTML notes live on GitHub</p>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <Ic d={I.github} size={20} color="var(--accent)" />
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16 }}>GitHub Repository</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[["GitHub Username", owner, setOwner, "e.g. johndoe"], ["Repository Name", repo, setRepo, "e.g. my-study-notes"]].map(([label, val, fn, ph]) => (
            <div key={label}>
              <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>{label}</label>
              <Input value={val} onChange={fn} placeholder={ph} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 14 }}>
            {[["Branch", branch, setBranch, "main"], ["Notes Folder", folder, setFolder, "notes"]].map(([label, val, fn, ph]) => (
              <div key={label} style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>{label}</label>
                <Input value={val} onChange={fn} placeholder={ph} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 14, margin: "20px 0", fontSize: 12, color: "var(--text2)", lineHeight: 1.8 }}>
          📁 HTML files will be loaded from:<br />
          <code style={{ color: "var(--accent)", fontSize: 11 }}>
            github.com/{owner || "username"}/{repo || "repo"}/{folder || "notes"}/*.html
          </code>
          <br /><br />
          ⚠️ Repo must be <strong style={{ color: "var(--text)" }}>public</strong> for the GitHub API to work without authentication.
        </div>

        <Btn onClick={save} variant={saved ? "green" : "primary"} style={{ width: "100%" }} size="lg">
          {saved ? <><Ic d={I.check} size={16} />Saved!</> : <><Ic d={I.check} size={16} />Save Settings</>}
        </Btn>
      </Card>

      <Card style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Ic d={I.upload} size={18} color="var(--blue)" />
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>How to add HTML notes</span>
        </div>
        {[
          ["1", "Create a folder called notes/ (or your custom folder) in your GitHub repo"],
          ["2", "Upload any .html files into that folder via GitHub.com or git push"],
          ["3", "Go to Threads and click Refresh — your files appear instantly"],
          ["4", "Click any thread to render the HTML note inside the app"],
        ].map(([n, text]) => (
          <div key={n} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--accent)22", border: "1px solid var(--accent)44", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12, color: "var(--accent)", flexShrink: 0 }}>{n}</div>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, paddingTop: 2 }}>{text}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Root App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  const [goals, setGoals] = useState(() => lsGet(LS_KEYS.goals, []));
  const [importants, setImportants] = useState(() => lsGet(LS_KEYS.importants, []));
  const [images, setImages] = useState(() => lsGet(LS_KEYS.images, []));
  const [notes, setNotes] = useState(() => lsGet(LS_KEYS.notes, []));
  const [streak, setStreak] = useState(() => lsGet(LS_KEYS.streak, 0));
  const [config, setConfig] = useState(() => lsGet(LS_KEYS.config, {}));

  useEffect(() => {
    if (!config.owner) setShowSetup(true);
  }, []);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: I.home },
    { id: "threads", label: "Threads", icon: I.thread },
    { id: "notes", label: "Notes", icon: I.notes, count: notes.length },
    { id: "settings", label: "Settings", icon: I.settings },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      {showSetup && <SetupModal config={config} onSave={c => { setConfig(c); lsSet(LS_KEYS.config, c); setShowSetup(false); }} />}

      {/* Sidebar */}
      <aside style={{ width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic d={I.book} size={17} color="#000" />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16, letterSpacing: "-.01em" }}>StudyFlow</div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 500 }}>your knowledge hub</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: active ? "var(--accent)18" : "transparent", border: `1px solid ${active ? "var(--accent)33" : "transparent"}`, color: active ? "var(--accent)" : "var(--text2)", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: active ? 600 : 400, transition: "all .15s", width: "100%" }}>
                <Ic d={item.icon} size={16} color={active ? "var(--accent)" : "var(--text3)"} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count > 0 && <span style={{ background: active ? "var(--accent)33" : "var(--surface2)", color: active ? "var(--accent)" : "var(--text3)", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{item.count}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "12px 16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontWeight: 600, letterSpacing: ".06em" }}>REPO</div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7, wordBreak: "break-all" }}>
            {config.owner ? <><span style={{ color: "var(--accent)" }}>{config.owner}</span>/{config.repo}</> : <span style={{ color: "var(--text3)", fontStyle: "italic" }}>Not configured</span>}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ padding: "14px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Ic d={I.search} size={15} color="var(--text3)" />
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", padding: "9px 14px 9px 38px", fontSize: 13.5, fontFamily: "var(--font-body)", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; setTimeout(() => setSearch(""), 200); }}
            />
            {search.trim() && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, zIndex: 100, boxShadow: "0 20px 60px #00000060", overflow: "hidden" }}>
                {notes.filter(n => (n.title + n.body).toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(n => (
                  <div key={n.id} onClick={() => { setPage("notes"); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Ic d={I.notes} size={15} color="var(--purple)" />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>note · {fmt(n.date)}</div>
                    </div>
                  </div>
                ))}
                {notes.filter(n => (n.title + n.body).toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--text3)" }}>No results</div>
                )}
              </div>
            )}
          </div>
          <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--text3)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px" }}>
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        <div style={{ padding: 28, flex: 1 }}>
          {page === "dashboard" && <DashboardPage goals={goals} setGoals={setGoals} importants={importants} setImportants={setImportants} images={images} setImages={setImages} streak={streak} setStreak={setStreak} />}
          {page === "threads" && <ThreadsPage config={config} setPage={setPage} />}
          {page === "notes" && <NotesPage notes={notes} setNotes={setNotes} />}
          {page === "settings" && <SettingsPage config={config} setConfig={setConfig} />}
        </div>
      </main>
    </div>
  );
}
