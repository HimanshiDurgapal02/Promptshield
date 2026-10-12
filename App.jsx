import { useEffect, useState } from "react";

const riskOf = (s) => (s >= 50 ? "high" : s >= 20 ? "medium" : "low");

function ScoreCard({ title, run }) {
  if (!run) return <div className="card empty">No {title.toLowerCase()} scan yet. Run one below.</div>;
  const score = Number(run.score);
  return (
    <div className={`card risk-${riskOf(score)}`}>
      <h2>{title}</h2>
      <p className="score">{score}<span>/100</span></p>
      <div className="meter"><div style={{ width: `${score}%` }} /></div>
      <p className="detail">
        {run.leaked_count} of {run.total_attacks} attacks leaked the secret ({riskOf(score)} risk)
      </p>
    </div>
  );
}

function Categories({ weak, defended }) {
  const names = (weak || defended)?.categories.map((c) => c.category) || [];
  const find = (run, name) => run?.categories.find((c) => c.category === name);
  return (
    <div className="panel">
      <h2>Leaks by attack type</h2>
      {names.map((name) => (
        <div className="cat" key={name}>
          <p>{name}</p>
          {[["Before", weak], ["After", defended]].map(([label, run]) => {
            const c = find(run, name);
            const pct = c ? (100 * c.leaked) / c.total : 0;
            return (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div className="bar"><div className={label === "Before" ? "before" : "after"} style={{ width: `${pct}%` }} /></div>
                <span>{c ? `${c.leaked}/${c.total}` : "-"}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Results({ runId }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!runId) return;
    fetch(`/api/runs/${runId}`).then((r) => r.json()).then(setRows);
  }, [runId]);
  return (
    <table>
      <thead><tr><th>Attack</th><th>Type</th><th>Result</th><th>Stopped by</th><th>Bot reply</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.attack_id}>
            <td>{r.attack_id} {r.name}</td>
            <td>{r.category}</td>
            <td><span className={r.leaked ? "tag leak" : "tag safe"}>{r.leaked ? "Leaked" : "Safe"}</span></td>
            <td>{r.layer}</td>
            <td className="reply">{r.response}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function App() {
  const [data, setData] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("weak");

  const load = () =>
    fetch("/api/compare").then((r) => r.json()).then((d) => {
      if (d.error) throw new Error(d.error);
      setData(d);
    }).catch((e) => setError(`Could not load results: ${e.message}. Is the backend running?`));

  useEffect(() => { load(); }, []);

  const scan = async (mode) => {
    setBusy(mode); setError("");
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      await load(); setView(mode);
    } catch (e) { setError(`Scan failed: ${e.message}`); }
    setBusy("");
  };

  const drop = data.weak && data.defended ? Number(data.weak.score) - Number(data.defended.score) : null;

  return (
    <main>
      <header>
        <h1>PromptShield</h1>
        <p>Attacks our own chatbot, HelpBot, with 15 known prompt injections and scores how easily its secret leaks.</p>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button disabled={!!busy} onClick={() => scan("weak")}>{busy === "weak" ? "Scanning..." : "Scan original chatbot"}</button>
        <button disabled={!!busy} onClick={() => scan("defended")}>{busy === "defended" ? "Scanning..." : "Scan defended chatbot"}</button>
      </div>

      <section className="scores">
        <ScoreCard title="Before defense" run={data.weak} />
        <div className="arrow">{drop !== null ? `-${drop.toFixed(1)} points` : ""}</div>
        <ScoreCard title="After defense" run={data.defended} />
      </section>

      <Categories weak={data.weak} defended={data.defended} />

      <section className="panel">
        <div className="tabs">
          {["weak", "defended"].map((m) => (
            <button key={m} className={view === m ? "on" : ""} onClick={() => setView(m)}>
              {m === "weak" ? "Original results" : "Defended results"}
            </button>
          ))}
        </div>
        <Results runId={data[view]?.id} />
      </section>
    </main>
  );
}
