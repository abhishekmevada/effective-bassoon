import React, { useState } from "react";
import "../style/Home.css";
import { Globe } from "lucide-react";
import { generatePDF } from "../utils/generatePDF";

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

export default function Home() {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectcard, setSelectcard] = useState<string | null>(null);

  const domainFun = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // https://super-octo-tribble.onrender.com
    try {
      const res = await fetch(
        "https://super-octo-tribble.onrender.com/domain",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        },
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || "Analysis Failed");
        return;
      }

      setReport(json.data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something Wrong";
      setError(
        msg.includes("Failed to fetch")
          ? "The analysis server timed out or crashed (Try again)."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  function getScoreColor(score: number): string {
    if (score >= 80) return "#3c83f6";
    if (score >= 60) return "#eab308";
    return "#ef4444";
  }

  const overallscore = report?.overall.score ?? 0;
  const color = getScoreColor(overallscore);

  const newScan = () => {
    setReport(null);
    setLoading(false);
    setError(null);
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    generatePDF(report);
  };
  return (
    <div>
      <header className="xheader">
        <p className="xHeaderName">
          Site<span>Audit</span>
        </p>
        {report ? (
          <div className="xHeaderBox">
            <button className="xHeaderButtona" onClick={handleDownloadPdf}>
              Download Report
            </button>
            <button className="xHeaderButton" onClick={newScan}>
              New Scan
            </button>
          </div>
        ) : null}
      </header>
      {!loading && !report && (
        <section className="domainHerosection">
          <h1 className="domainHerosectionH1">
            Analyze any website <br /> in seconds
          </h1>
          <p className="domainHerosectionP">
            Get instant insights on SEO, accessibility, security, SSL, and DNS.
            <br />
            Actionable recommendations, not just raw data.
          </p>
          <form onSubmit={domainFun} className="domainHerosectionForm">
            <div className="domainformminBOx">
              <Globe className="domainHerosectionFormIco" />
              <input
                type="text"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDomain(e.target.value)
                }
                value={domain}
                placeholder="example.com"
                className="domainHerosectionFormInput"
                required
              />
            </div>

            <button type="submit" className="domainHerosectionFormButton">
              Analyze
            </button>
          </form>
          <div className="hero-trust">
            <span>46 checks</span>
            <span className="trust-dot" />
            <span>5 categories</span>
            <span className="trust-dot" />
            <span>Instant results</span>
          </div>
          {error && <div>{error}</div>}
        </section>
      )}

      {loading && (
        <section className="domainLoadingSection">
          <div className="loadingSectionBox">
            <div className="loadingSectionLoader"></div>
          </div>
          <p>
            Analyzing <strong>{domain}</strong>
          </p>
          <p className="domainHerosectionP">
            Running 46 checks across SEO, accessibility, security, SSL, and
            DNS...
          </p>
        </section>
      )}

      {report && (
        <section className="reportSection">
          <div className="reportSectionFirstContainer">
            <div className="reportSectionContainera">
              <div className="reportSectionContaineraBoxa">
                <p className="reportSectionContaineraBoxadomainname">
                  {report.domain}
                </p>
                <div className="reportSectionContaineraBoxaminbox">
                  <p className="reportSectionContaineraBoxaminboxp">
                    {report.overview.online ? "Online" : "Offline"}
                  </p>
                  <p className="reportSectionContaineraBoxaminboxp">
                    {report.overview.https ? "HTTPS" : "No HTTPS"}
                  </p>
                  <p className="reportSectionContaineraBoxaminboxp">
                    {report.overview.indexable ? "Indexable" : "Not Indexable"}
                  </p>
                </div>
              </div>
              <div className="reportSectionContaineraBoxb">
                <p className="reportSectionContaineraBoxbp">
                  Hosted: {report.overview.hosting}
                </p>
                <p className="reportSectionContaineraBoxbp">
                  TLS Version: {report.overview.tlsVersion}
                </p>
                <p className="reportSectionContaineraBoxbp">
                  Language: {report.overview.language}
                </p>
                <p className="reportSectionContaineraBoxbp">
                  Images Count: {report.overview.imagesCount}
                </p>
                <p className="reportSectionContaineraBoxbp">
                  Internal Links: {report.overview.internalLinks}
                </p>
                <p className="reportSectionContaineraBoxbp">
                  External Links: {report.overview.externalLinks}
                </p>
              </div>
            </div>
            <div className="reportSectionContinaerb">
              <div className="reportSectionContainerbScoreCon">
                <div
                  className="reportSectionContainerbScoreBox"
                  style={{
                    background: `conic-gradient(${color} calc(${report.overall.score} * 1%), transparent 0)`,
                  }}
                >
                  <div className="reportSectionContainerbScoreBoxscore">
                    <p>{report.overall.score}</p>
                    <p>{report.overall.grade}</p>
                  </div>
                </div>
              </div>

              <p>{report.overall.status}</p>
              <div className="reportSectionContainerbSummaryBox">
                <p className="reportSectionContainerbSummaryBoxp">
                  {report.summary.totalChecks} checks &middot;{" "}
                  {report.summary.passed} passed &middot;{" "}
                  {report.summary.warnings} warnings &middot;{" "}
                  {report.summary.failures} failures
                </p>
              </div>
            </div>
          </div>
          <div className="reportSectionSecondContainer">
            {Object.entries(report.categories).map(([name, category]) => {
              const score = category.score;
              const color = getScoreColor(score);
              return (
                <div
                  key={name}
                  className={`reportSectionSecondContainerCardCon ${selectcard === name ? "selected" : ""}`}
                  onClick={() =>
                    setSelectcard(selectcard === name ? null : name)
                  }
                >
                  <div className="reportSectionSecondContainerCardConBoxa">
                    <p className="CardConBoxaName">{name}</p>
                    <p
                      className="CardConBoxaScore"
                      style={{ color: `${color}` }}
                    >
                      {category.score}
                    </p>
                  </div>
                  <div className="reportSectionSecondContainerCardConProgressBar">
                    <div
                      className="reportSectionSecondContainerCardConProgress"
                      style={{
                        width: `${category.score}%`,
                        background: `${color}`,
                      }}
                    ></div>
                  </div>
                  <div className="reportSectionSecondContainerCardConBoxb">
                    <p className="CardConBoxbp">
                      <div className="CardConBoxbDota"></div>
                      {category.passed}
                    </p>
                    <p className="CardConBoxbp">
                      <div className="CardConBoxbDotb"></div>
                      {category.warnings}
                    </p>
                    <p className="CardConBoxbp">
                      <div className="CardConBoxbDotc"></div>
                      {category.failures}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {selectcard ? (
            <div
              className="reportSectionPriorityissuesCon"
              style={{ width: "100%" }}
            >
              <div
                className="reportSectionPriorityissuesConheader"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p>{selectcard.toUpperCase()} CHECKS</p>
                <button
                  className="reportSectionContaineraBoxaminboxp"
                  style={{
                    cursor: "pointer",
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--textPri)",
                  }}
                  onClick={() => setSelectcard(null)}
                >
                  Close
                </button>
              </div>
              <div className="priorityissuesConBody">
                {report.findings
                  .filter(
                    (f) =>
                      f.category === selectcard &&
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
                  .map((finding, index) => (
                    <div key={index} className="priorityissuesConBodyBox">
                      <div className="priorityissuesConBodyBoxminBox">
                        <div className="priorityissuesx">
                          {finding.status === "pass" ? (
                            <p
                              className="positiveConp"
                              style={{ margin: 0, marginRight: "10px" }}
                            >
                              ✓
                            </p>
                          ) : (
                            <p
                              className={`priserverity badge-${finding.severity || finding.status}`}
                            >
                              {finding.severity || finding.status}
                            </p>
                          )}
                          <p
                            style={{
                              color:
                                finding.status === "pass"
                                  ? "#22c55e"
                                  : "inherit",
                            }}
                          >
                            {finding.title}
                          </p>
                        </div>
                      </div>
                      {finding.message && finding.status !== "pass" && (
                        <p
                          style={{
                            color: "var(--text-secondary)",
                            marginTop: "10px",
                          }}
                        >
                          {finding.message}
                        </p>
                      )}
                      {finding.recommendation && finding.status !== "pass" && (
                        <p style={{ marginTop: "10px" }}>
                          → {finding.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <>
              <div className="reportSectionThirdContainer">
                <p>Technolody</p>
                <div className="reportSectionThirdContainerBox">
                  <div className="reportSectionThirdContainerBoxminbox">
                    <p className="techplabel">HOSTING</p>
                    <p>{report.technology.hosting}</p>
                  </div>
                  <div className="reportSectionThirdContainerBoxminbox">
                    <p className="techplabel">SERVER</p>
                    <p>{report.technology.server}</p>
                  </div>
                  <div className="reportSectionThirdContainerBoxminbox">
                    <p className="techplabel">CDN</p>
                    <p>{report.technology.cdn}</p>
                  </div>
                  <div className="reportSectionThirdContainerBoxminbox">
                    <p className="techplabel">FRAMWORK</p>
                    <p>{report.technology.framework}</p>
                  </div>
                  <div className="reportSectionThirdContainerBoxminbox">
                    <p className="techplabel">ANALYTICS</p>
                    <p>{report.technology.analytics}</p>
                  </div>
                </div>
              </div>
              <div className="reportSectionFourthContainer">
                <div className="reportSectionPriorityissuesCon">
                  <div className="reportSectionPriorityissuesConheader">
                    <p>PRIORITY ISSUES</p>
                    <p className="reportSectionContaineraBoxaminboxp">
                      {report.priorityIssues.length}
                    </p>
                  </div>
                  <div className="priorityissuesConBody">
                    {report.priorityIssues.map((pri, index) => (
                      <div key={index} className="priorityissuesConBodyBox">
                        <div className="priorityissuesConBodyBoxminBox">
                          <div className="priorityissuesx">
                            <p className={`priserverity badge-${pri.severity}`}>
                              {pri.severity}
                            </p>
                            <p>{pri.title}</p>
                          </div>
                          <p className="reportSectionContaineraBoxaminboxp">
                            {pri.category}
                          </p>
                        </div>
                        {/* <p style={{ color: "var(--text-secondary)" }}>
                          {pri.message}
                        </p> */}
                        <p style={{ color: "var(--text-secondary)" }}>
                          {pri.recommendation}
                        </p>
                        {/* <p>Impact: {pri.impact}</p> */}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="reportSectionPriorityissuesCon">
                  <div className="reportSectionPriorityissuesConheader">
                    <p>WHAT'S GOOD</p>
                    <p className="reportSectionContaineraBoxaminboxp">
                      {report.positives.length}
                    </p>
                  </div>
                  <div className="priorityissuesConBody">
                    {report.positives.map((pos, index) => (
                      <div key={index} className="positiveCon">
                        <p className="positiveConp">
                          ✓ <span className="positiveConspan">{pos}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
