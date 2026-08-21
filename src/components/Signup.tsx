import { useState, useRef } from "react";
// import { generatePDF } from "../utils/generatePDF";
import "../style/Home.css";

interface CategoryScore {
  score: number;
  passed: number;
  warnings: number;
  failures: number;
}

interface PriorityIssue {
  severity: string;
  category: string;
  title: string;
  message: string;
  recommendation: string | null;
  impact: string | null;
}

interface Report {
  domain: string;
  timestamp: string;
  scanConfidence: {
    level: string;
    completedChecks: number;
    totalChecks: number;
    note: string;
  };
  overview: {
    online: boolean;
    https: boolean;
    indexable: boolean;
    hosting: string | null;
    tlsVersion: string | null;
    language: string | null;
    imagesCount: number;
    internalLinks: number;
    externalLinks: number;
  };
  technology: {
    hosting: string | null;
    server: string | null;
    cdn: string | null;
    framework: string | null;
    analytics: string[];
  };
  overall: { score: number; grade: string; status: string };
  categories: Record<string, CategoryScore>;
  priorityIssues: PriorityIssue[];
  positives: string[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  findings: any[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  return "#ef4444";
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="score-ring">
      <svg viewBox="0 0 140 140">
        <circle className="score-ring-bg" cx="70" cy="70" r={radius} />
        <circle
          className="score-ring-fill"
          cx="70"
          cy="70"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-text">
        <span className="score-value" style={{ color }}>
          {score}
        </span>
        <span className="score-grade">{grade}</span>
      </div>
    </div>
  );
}

function CategoryCard({
  name,
  data,
  isSelected,
  onClick,
}: {
  name: string;
  data: CategoryScore;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = getScoreColor(data.score);
  return (
    <div
      className={`category-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="category-header">
        <span className="category-label">{name}</span>
        <span className="category-score-num" style={{ color }}>
          {data.score}
        </span>
      </div>
      <div className="category-bar">
        <div
          className="category-bar-fill"
          style={{ width: `${data.score}%`, background: color }}
        />
      </div>
      <div className="category-stats">
        <span>
          <span className="stat-dot stat-dot-pass" />
          {data.passed}
        </span>
        <span>
          <span className="stat-dot stat-dot-warn" />
          {data.warnings}
        </span>
        <span>
          <span className="stat-dot stat-dot-fail" />
          {data.failures}
        </span>
      </div>
    </div>
  );
}

export default function Signup() {
  const [domain, setDomain] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const reportRef = useRef<HTMLElement>(null);

  const submitDomain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setReport(null);
    setLoading(true);
    setSelectedCategory(null);

    try {
      const res = await fetch("http://localhost:5000/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Analysis failed");
        return;
      }

      setReport(json.data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Connection failed";
      setError(msg.includes("Failed to fetch") ? "The analysis server timed out or crashed (Try again)." : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    setReport(null);
    setError(null);
    setSelectedCategory(null);
  };

  // const handleDownloadPdf = () => {
  //   if (!report) return;
  //   generatePDF(report);
  // };

  return (
    <div className="page-signup">
      {/* ── Nav ──────────────────────────────────── */}
      <nav className="signup-nav">
        <a href="/" className="signup-logo">
          Site<span>Audit</span>
        </a>
        {/* <div className="signup-nav-links">
          <a href="/login">Log in</a>
          <a href="/" className="nav-cta">
            Sign up
          </a>
        </div> */}
      </nav>

      {/* ── Hero + Input ─────────────────────────── */}
      {!report && !loading && (
        <section className="signup-hero">
          <h1 className="hero-headline">
            Analyze any website
            <br />
            in seconds
          </h1>
          <p className="hero-sub">
            Get instant insights on SEO, accessibility, security, SSL, and DNS.
            <br />
            Actionable recommendations, not just raw data.
          </p>

          <form className="domain-form" onSubmit={submitDomain}>
            <div className="domain-input-group">
              <span className="domain-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <input
                className="domain-input"
                type="text"
                id="domain-input"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
              />
              <button className="domain-submit" type="submit" id="analyze-btn">
                Analyze
              </button>
            </div>
          </form>

          <div className="hero-trust">
            <span>46 checks</span>
            <span className="trust-dot" />
            <span>5 categories</span>
            <span className="trust-dot" />
            <span>Instant results</span>
          </div>

          {error && <div className="error-notice">{error}</div>}
        </section>
      )}

      {/* ── Loading ──────────────────────────────── */}
      {loading && (
        <section className="signup-hero">
          <div className="loading-section">
            <div className="loading-spinner" />
            <p className="loading-text">
              Analyzing <strong>{domain}</strong>
            </p>
            <p className="loading-sub">
              Running 46 checks across SEO, accessibility, security, SSL, and
              DNS...
            </p>
          </div>
        </section>
      )}

      {/* ── Results ──────────────────────────────── */}
      {report && (
        <section className="results-section" ref={reportRef}>
          {/* Header */}
          <div className="results-header" data-html2canvas-ignore>
            <div className="results-domain">
              Report for <strong>{report.domain}</strong>
            </div>
            <div className="action-buttons">
              {/* <button className="btn-secondary" onClick={handleDownloadPdf}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="14"
                  height="14"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button> */}
              <button className="btn-secondary" onClick={handleRescan}>
                ← New scan
              </button>
            </div>
          </div>

          {/* Scan Confidence */}
          <div className="scan-confidence">
            <span className="confidence-label">SCAN QUALITY</span>
            <span className="confidence-level">
              {report.scanConfidence.level === "High confidence" ? "🟢" : "🟡"}{" "}
              {report.scanConfidence.level}
            </span>
            <span className="confidence-checks">
              {report.scanConfidence.completedChecks} /{" "}
              {report.scanConfidence.totalChecks} checks completed
            </span>
            {report.scanConfidence.note && (
              <span className="confidence-note">
                {report.scanConfidence.note}
              </span>
            )}
          </div>

          {/* Overview */}
          <div className="report-overview">
            <div className="overview-primary">
              <h2>{report.domain}</h2>
              <div className="overview-badges">
                <span className="badge">
                  {report.overview.online ? "🟢 Online" : "🔴 Offline"}
                </span>
                <span className="badge">
                  {report.overview.https ? "🟢 HTTPS" : "🔴 No HTTPS"}
                </span>
                <span className="badge">
                  {report.overview.indexable
                    ? "🟢 Indexable"
                    : "🔴 Not Indexable"}
                </span>
              </div>
            </div>
            <div className="overview-secondary">
              {report.overview.hosting && (
                <span>{report.overview.hosting}</span>
              )}
              {report.overview.tlsVersion && (
                <span>{report.overview.tlsVersion}</span>
              )}
              {report.overview.language && (
                <span>{report.overview.language.toUpperCase()}</span>
              )}
              <span>{report.overview.imagesCount} images</span>
              <span>{report.overview.internalLinks} internal links</span>
              <span>{report.overview.externalLinks} external links</span>
            </div>
          </div>

          {/* Overall Score */}
          <div className="score-card">
            <div className="score-ring-container">
              <ScoreRing
                score={report.overall.score}
                grade={report.overall.grade}
              />
            </div>
            <div className="score-status">{report.overall.status}</div>
            <div className="score-summary">
              {report.summary.totalChecks} checks &middot;{" "}
              {report.summary.passed} passed &middot; {report.summary.warnings}{" "}
              warnings &middot; {report.summary.failures} failures
            </div>
          </div>

          {/* Category Cards */}
          <div className="categories-grid">
            {Object.entries(report.categories).map(([cat, data]) => (
              <CategoryCard
                key={cat}
                name={cat}
                data={data}
                isSelected={selectedCategory === cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
              />
            ))}
          </div>

          {selectedCategory ? (
            <div className="report-panel category-details-panel">
              <div
                className="panel-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{selectedCategory.toUpperCase()} Checks</span>
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={() => setSelectedCategory(null)}
                >
                  Close
                </button>
              </div>
              <ul className="issue-list" style={{ maxHeight: "none" }}>
                {report.findings
                  .filter(
                    (f) =>
                      f.category === selectedCategory &&
                      f.status !== "unknown" &&
                      f.status !== "info",
                  )
                  .sort((a, b) => {
                    const weight = { fail: 3, warn: 2, pass: 1 };
                    return (
                      (weight[b.status as keyof typeof weight] || 0) -
                      (weight[a.status as keyof typeof weight] || 0)
                    );
                  })
                  .map((finding, i) => (
                    <li key={i} className="issue-item">
                      <div className="issue-top">
                        {finding.status === "pass" ? (
                          <span
                            className="positive-icon"
                            style={{ flexShrink: 0, marginTop: "2px" }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className={`issue-badge badge-${finding.severity || finding.status}`}
                          >
                            {finding.severity || finding.status}
                          </span>
                        )}
                        <span
                          className="issue-title"
                          style={{
                            color:
                              finding.status === "pass" ? "#22c55e" : "inherit",
                          }}
                        >
                          {finding.title}
                        </span>
                      </div>
                      {finding.message && finding.status !== "pass" && (
                        <div
                          className="issue-rec"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {finding.message}
                        </div>
                      )}
                      {finding.recommendation && finding.status !== "pass" && (
                        <div className="issue-rec">
                          → {finding.recommendation}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <>
              {/* Technology */}
              <div className="report-panel tech-panel">
                <div className="panel-header">Technology</div>
                <div className="tech-grid">
                  <div className="tech-item">
                    <span className="tech-label">Hosting</span>
                    <span className="tech-value">
                      {report.technology.hosting || "Unknown"}
                    </span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Server</span>
                    <span className="tech-value">
                      {report.technology.server || "Unknown"}
                    </span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">CDN</span>
                    <span className="tech-value">
                      {report.technology.cdn || "Not detected"}
                    </span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Framework</span>
                    <span className="tech-value">
                      {report.technology.framework || "Not detected"}
                    </span>
                  </div>
                  <div className="tech-item">
                    <span className="tech-label">Analytics</span>
                    <span className="tech-value">
                      {report.technology.analytics.length > 0
                        ? report.technology.analytics.join(", ")
                        : "Not detected"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issues + Positives */}
              <div className="report-columns">
                {/* Priority Issues */}
                <div className="report-panel">
                  <div className="panel-header">
                    Priority Issues
                    <span className="panel-count">
                      {report.priorityIssues.length}
                    </span>
                  </div>
                  <ul className="issue-list">
                    {report.priorityIssues.map((issue, i) => (
                      <li key={i} className="issue-item">
                        <div className="issue-top">
                          <span
                            className={`issue-badge badge-${issue.severity}`}
                          >
                            {issue.severity}
                          </span>
                          <span className="issue-title">{issue.title}</span>
                          <span className="issue-category-tag">
                            {issue.category}
                          </span>
                        </div>
                        {issue.recommendation && (
                          <div className="issue-rec">
                            → {issue.recommendation}
                          </div>
                        )}
                      </li>
                    ))}
                    {report.priorityIssues.length === 0 && (
                      <li className="issue-item">
                        <div className="issue-top">
                          <span
                            className="issue-title"
                            style={{ color: "#22c55e" }}
                          >
                            No issues found — great job!
                          </span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

                {/* What's Good */}
                <div className="report-panel">
                  <div className="panel-header">
                    What's Good
                    <span className="panel-count">
                      {report.positives.length}
                    </span>
                  </div>
                  <ul className="issue-list">
                    {report.positives.map((p, i) => (
                      <li key={i} className="positive-item">
                        <span className="positive-icon">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Footer ───────────────────────────────── */}
      <footer className="signup-footer">
        SiteAudit · Website Intelligence
      </footer>
    </div>
  );
}
