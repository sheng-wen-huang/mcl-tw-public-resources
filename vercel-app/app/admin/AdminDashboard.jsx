"use client";

import { useEffect, useMemo, useState } from "react";
import mermaid from "mermaid";

const emptyForm = {
  configName: "",
  spName: "",
  client: "",
  logicType: "Allocation",
  overview: "",
  mermaid: "flowchart TD\n  A([Start]) --> B[Check order]\n  B --> C([End])",
  examplesText: "",
  hashtagsText: ""
};

function flowToForm(flow) {
  return {
    configName: flow.configName || "",
    spName: flow.spName || "",
    client: flow.client || "",
    logicType: flow.logicType || "Allocation",
    overview: flow.overview || flow.description || "",
    mermaid: flow.mermaid || "",
    examplesText: JSON.stringify(flow.examples || [], null, 2),
    hashtagsText: (flow.hashtags || flow.relatedConfigs || []).map((tag) => `#${String(tag).replace(/^#+/, "")}`).join(" ")
  };
}

function formToPayload(form) {
  let examples = [];
  if (form.examplesText.trim()) {
    examples = JSON.parse(form.examplesText);
  }

  return {
    configName: form.configName,
    spName: form.spName,
    client: form.client,
    logicType: form.logicType,
    overview: form.overview,
    description: form.overview,
    mermaid: form.mermaid,
    examples,
    hashtags: form.hashtagsText
      .split(/[\s,]+/)
      .map((item) => item.trim().replace(/^#+/, ""))
      .filter(Boolean)
  };
}

export default function AdminDashboard({ user, publicSiteUrl }) {
  const [flows, setFlows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewSvg, setPreviewSvg] = useState("");
  const [previewError, setPreviewError] = useState("");

  const selected = useMemo(
    () => flows.find((flow) => flow.id === selectedId),
    [flows, selectedId]
  );

  async function loadFlows() {
    const res = await fetch("/api/flows", { cache: "no-store" });
    const data = await res.json();
    setFlows(data);
    if (!selectedId && data.length) {
      setSelectedId(data[0].id);
      setForm(flowToForm(data[0]));
    }
  }

  useEffect(() => {
    loadFlows().catch((err) => setMessage(err.message));
  }, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        primaryColor: "#fff1eb",
        primaryTextColor: "#1a1a1a",
        primaryBorderColor: "#ff5a1f",
        nodeTextColor: "#1a1a1a",
        textColor: "#1a1a1a",
        lineColor: "#5c5c5c",
        secondaryColor: "#f5f3ee",
        tertiaryColor: "#ffffff",
        fontFamily: "Inter, sans-serif",
        fontSize: "14px"
      },
      flowchart: { curve: "basis", padding: 20, htmlLabels: false }
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const code = form.mermaid.trim();

    if (!code) {
      setPreviewSvg("");
      setPreviewError("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { svg } = await mermaid.render(`admin-preview-${Date.now()}`, code);
        if (!isCancelled) {
          setPreviewSvg(svg);
          setPreviewError("");
        }
      } catch (err) {
        if (!isCancelled) {
          setPreviewSvg("");
          setPreviewError(err.message || "Mermaid syntax error");
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [form.mermaid]);

  function selectFlow(flow) {
    setSelectedId(flow.id);
    setForm(flowToForm(flow));
    setMessage("");
  }

  function startNew() {
    setSelectedId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveFlow(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const payload = formToPayload(form);
      const res = await fetch(selectedId ? `/api/flows/${selectedId}` : "/api/flows", {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.errors?.join(" ") || data.error || "Save failed");
      }

      setMessage(`Saved. Updated by ${data.updatedBy}.`);
      await loadFlows();
      setSelectedId(data.id);
      setForm(flowToForm(data));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveFlow() {
    if (!selectedId || !selected) return;
    if (!confirm(`Archive ${selected.configName} / ${selected.spName}?`)) return;

    const res = await fetch(`/api/flows/${selectedId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Archive failed");
      return;
    }

    setMessage("Archived.");
    setSelectedId(null);
    setForm(emptyForm);
    await loadFlows();
  }

  const homepageUrl = publicSiteUrl === "https://sheng-wen-huang.github.io"
    ? "https://sheng-wen-huang.github.io/mcl-tw-public-resources/"
    : publicSiteUrl;

  return (
    <main className="shell">
      <a className="back-link" href={homepageUrl}>Back to homepage</a>
      <div className="topbar">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1>Maintain WMS flowcharts.</h1>
          <p className="muted">
            Signed in as {user.name} ({user.githubUsername}). Changes are saved
            to MongoDB Atlas and stamped with your GitHub account.
          </p>
        </div>
        <div className="actions">
          <button className="button primary" onClick={startNew}>New flow</button>
        </div>
      </div>

      {message ? (
        <div className={`notice ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("required") ? "error" : ""}`}>
          {message}
        </div>
      ) : null}

      <div className="grid" style={{ marginTop: 18 }}>
        <section className="panel">
          <h2>Flowcharts</h2>
          <div className="list">
            {flows.length === 0 ? (
              <p className="muted">No flowcharts yet.</p>
            ) : flows.map((flow) => (
              <button
                key={flow.id}
                className={`flow-item ${flow.id === selectedId ? "active" : ""}`}
                onClick={() => selectFlow(flow)}
              >
                <strong>{flow.configName} / {flow.spName}</strong>
                <span className="meta">
                  {flow.logicType} · updated by {flow.updatedBy || "unknown"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{selectedId ? "Edit flowchart" : "New flowchart"}</h2>
          <form className="form" onSubmit={saveFlow}>
            <div className="split">
              <div className="field">
                <label>Config name</label>
                <input value={form.configName} onChange={(e) => updateField("configName", e.target.value)} required />
              </div>
              <div className="field">
                <label>SP name</label>
                <input value={form.spName} onChange={(e) => updateField("spName", e.target.value)} required />
              </div>
            </div>

            <div className="split">
              <div className="field">
                <label>Storer</label>
                <input value={form.client} onChange={(e) => updateField("client", e.target.value)} />
              </div>
              <div className="field">
                <label>Logic type</label>
                <input value={form.logicType} onChange={(e) => updateField("logicType", e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Overview</label>
              <textarea value={form.overview} onChange={(e) => updateField("overview", e.target.value)} />
            </div>

            <div className="field">
              <label>Mermaid source</label>
              <textarea className="tall" value={form.mermaid} onChange={(e) => updateField("mermaid", e.target.value)} required />
            </div>

            <div className="field">
              <label>Preview</label>
              <div className="preview-box">
                {previewError ? (
                  <div className="error">Syntax error: {previewError}</div>
                ) : previewSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: previewSvg }} />
                ) : (
                  <span className="meta">Preview appears here.</span>
                )}
              </div>
            </div>

            <div className="field">
              <label>Examples JSON</label>
              <textarea
                value={form.examplesText}
                onChange={(e) => updateField("examplesText", e.target.value)}
                placeholder='[{"title":"Enough inventory","scenario":"Order qty 10, available 20","expectedResult":"Allocate full quantity"}]'
              />
            </div>

            <div className="field">
              <label>Hashtags</label>
              <input
                value={form.hashtagsText}
                onChange={(e) => updateField("hashtagsText", e.target.value)}
                placeholder="#allocation #standard #ecommerce"
              />
            </div>

            <div className="actions">
              <button className="button primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              {selectedId ? (
                <button className="button danger" type="button" onClick={archiveFlow}>Archive</button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
