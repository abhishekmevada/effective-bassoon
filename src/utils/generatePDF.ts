import jsPDF from "jspdf";

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
  message?: string | null;
  recommendation?: string | null;
}

interface Report {
  domain: string;
  timestamp: string;
  overall: { score: number; grade: string; status: string };
  categories: Record<string, CategoryScore>;
  priorityIssues: PriorityIssue[];
  positives: string[];
  summary: { totalChecks: number; passed: number; warnings: number; failures: number };
}

// ── Simple Light Mode Colors ───────────────────────────────
const C = {
  bg:       [255, 255, 255] as [number,number,number],
  card:     [250, 250, 250] as [number,number,number],
  border:   [220, 224, 228] as [number,number,number],
  textPri:  [15, 23, 42]    as [number,number,number],
  textSec:  [71, 85, 105]   as [number,number,number],
  textMut:  [100, 116, 139] as [number,number,number],
  accent:   [37, 99, 235]   as [number,number,number],
  green:    [22, 163, 74]   as [number,number,number],
  yellow:   [217, 119, 6]   as [number,number,number],
  red:      [220, 38, 38]   as [number,number,number],
};

function scoreColor(score: number): [number,number,number] {
  if (score >= 80) return C.green;
  if (score >= 60) return C.yellow;
  return C.red;
}

function severityColor(sev: string): [number,number,number] {
  if (sev === "critical" || sev === "high") return C.red;
  if (sev === "medium") return C.yellow;
  return C.accent;
}

function drawBar(pdf: jsPDF, x: number, y: number, w: number, h: number, score: number) {
  pdf.setFillColor(...C.border);
  pdf.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  const fillW = (score / 100) * w;
  if (fillW > 0) {
    pdf.setFillColor(...scoreColor(score));
    pdf.roundedRect(x, y, fillW, h, h / 2, h / 2, "F");
  }
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(text, maxWidth);
}

export function generatePDF(report: Report) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 20; 

  function checkPage(needed: number) {
    if (y + needed > pageH - 20) {
      pdf.addPage();
      y = 20;
    }
  }

  // ── 1. Header ───────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...C.textPri);
  pdf.text("Website Audit Report", margin, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.textMut);
  const ts = new Date(report.timestamp).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  pdf.text(ts, pageW - margin, y - 1, { align: "right" });

  y += 12;

  // Domain & Summary
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...C.accent);
  pdf.text(report.domain, margin, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...C.textSec);
  pdf.text(`Analyzed ${report.summary.totalChecks} checks: ${report.summary.passed} passed, ${report.summary.warnings} warnings, ${report.summary.failures} failures.`, margin, y + 6);

  y += 16;
  pdf.setDrawColor(...C.border);
  pdf.line(margin, y, pageW - margin, y);
  y += 10;

  // ── 2. Overall Score ───────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(...C.textPri);
  pdf.text("Overall Health", margin, y);

  pdf.setFontSize(28);
  pdf.setTextColor(...scoreColor(report.overall.score));
  pdf.text(`${report.overall.score}/100`, pageW - margin, y + 2, { align: "right" });
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...C.textSec);
  pdf.text(`Status: ${report.overall.status} (Grade ${report.overall.grade})`, margin, y + 8);

  y += 20;
  pdf.setDrawColor(...C.border);
  pdf.line(margin, y, pageW - margin, y);
  y += 12;

  // ── 3. Category Scores ────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...C.textPri);
  pdf.text("Category Breakdown", margin, y);
  y += 8;

  const cats = Object.entries(report.categories);
  for (let i = 0; i < cats.length; i++) {
    const [name, data] = cats[i];
    checkPage(15);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.textPri);
    pdf.text(name.toUpperCase(), margin, y);
    
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...scoreColor(data.score));
    pdf.text(`${data.score}`, margin + 50, y);

    drawBar(pdf, margin + 60, y - 3, contentW - 60, 4, data.score);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.textSec);
    pdf.text(`Pass: ${data.passed} | Warn: ${data.warnings} | Fail: ${data.failures}`, margin, y + 5);

    y += 14;
  }

  y += 8;
  pdf.setDrawColor(...C.border);
  pdf.line(margin, y, pageW - margin, y);
  y += 12;

  // ── 4. Priority Issues ──────────────────────────
  checkPage(20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...C.textPri);
  pdf.text("Priority Issues", margin, y);
  y += 8;

  if (report.priorityIssues.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...C.green);
    pdf.text("No priority issues found! Excellent job.", margin, y);
    y += 10;
  } else {
    for (const issue of report.priorityIssues) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      const titleLines = wrapText(pdf, issue.title, contentW - 25);
      const titleH = titleLines.length * 5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      // Removed Unicode characters, using standard ascii bullets
      const msgLines = issue.message ? wrapText(pdf, `Reason: ${issue.message}`, contentW - 6) : [];
      const recLines = issue.recommendation ? wrapText(pdf, `Fix: ${issue.recommendation}`, contentW - 6) : [];
      
      const msgH = msgLines.length * 5;
      const recH = recLines.length * 5;

      let blockH = titleH;
      if (msgH > 0) blockH += msgH + 2;
      if (recH > 0) blockH += recH + 2;

      checkPage(blockH + 6);

      // Severity indicator text
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...severityColor(issue.severity));
      pdf.text(`[${issue.severity.toUpperCase()}]`, margin, y);

      pdf.setTextColor(...C.textPri);
      pdf.text(titleLines, margin + 25, y);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...C.textMut);
      pdf.text(issue.category.toUpperCase(), pageW - margin, y, { align: "right" });

      let curY = y + titleH + 1;

      if (msgLines.length > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...C.textSec);
        pdf.text(msgLines, margin + 6, curY);
        curY += msgH + 2;
      }

      if (recLines.length > 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(...C.textMut);
        pdf.text(recLines, margin + 6, curY);
      }

      y += blockH + 8;
    }
  }

  y += 4;
  pdf.setDrawColor(...C.border);
  pdf.line(margin, y, pageW - margin, y);
  y += 12;

  // ── 5. What's Good ──────────────────────────────
  checkPage(20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...C.textPri);
  pdf.text("What's Good", margin, y);
  y += 8;

  const posColW = (contentW - 6) / 2;
  const posRows = [];
  for (let i = 0; i < report.positives.length; i += 2) {
    posRows.push([report.positives[i], report.positives[i+1]]);
  }

  for (const row of posRows) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const leftLines = wrapText(pdf, row[0], posColW - 6);
    const rightLines = row[1] ? wrapText(pdf, row[1], posColW - 6) : [];
    
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const rowH2 = maxLines * 5;

    checkPage(rowH2 + 4);

    pdf.setTextColor(...C.green);
    pdf.text("+", margin, y);
    pdf.setTextColor(...C.textSec);
    pdf.text(leftLines, margin + 5, y);

    if (row[1]) {
      const rx = margin + posColW + 6;
      pdf.setTextColor(...C.green);
      pdf.text("+", rx, y);
      pdf.setTextColor(...C.textSec);
      pdf.text(rightLines, rx + 5, y);
    }

    y += rowH2 + 4;
  }

  // ── 6. Footer ──────────────────────
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...C.textMut);
    pdf.text(`SiteAudit · Website Intelligence · siteaudit.app`, pageW / 2, pageH - 6, { align: "center" });
    pdf.text(`Page ${p} / ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
  }

  pdf.save(`SiteAudit_${report.domain}_Report.pdf`);
}
