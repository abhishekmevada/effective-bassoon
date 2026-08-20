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
  recommendation: string | null;
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

// ── Colors ──────────────────────────────────────────────
const C = {
  bg:       [11, 13, 17]   as [number,number,number],
  card:     [22, 26, 34]   as [number,number,number],
  border:   [30, 34, 48]   as [number,number,number],
  textPri:  [232, 234, 237] as [number,number,number],
  textSec:  [139, 146, 158] as [number,number,number],
  textMut:  [92, 99, 112]   as [number,number,number],
  accent:   [59, 130, 246]  as [number,number,number],
  green:    [34, 197, 94]   as [number,number,number],
  yellow:   [234, 179, 8]   as [number,number,number],
  red:      [239, 68, 68]   as [number,number,number],
  greenBg:  [34, 197, 94, 0.15] as [number,number,number,number],
  yellowBg: [234, 179, 8, 0.15] as [number,number,number,number],
  redBg:    [239, 68, 68, 0.15] as [number,number,number,number],
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

function severityBg(sev: string): [number,number,number,number] {
  if (sev === "critical" || sev === "high") return C.redBg;
  if (sev === "medium") return C.yellowBg;
  return [59, 130, 246, 0.15];
}

// Helper: draw a rounded rect (jsPDF 2.x supports roundedRect)
function roundedRect(
  pdf: jsPDF,
  x: number, y: number, w: number, h: number,
  r: number,
  fillColor: [number,number,number],
  strokeColor?: [number,number,number]
) {
  pdf.setFillColor(...fillColor);
  if (strokeColor) {
    pdf.setDrawColor(...strokeColor);
    pdf.roundedRect(x, y, w, h, r, r, "FD");
  } else {
    pdf.setDrawColor(...fillColor);
    pdf.roundedRect(x, y, w, h, r, r, "F");
  }
}

// Helper: draw a score arc
function drawScoreRing(pdf: jsPDF, cx: number, cy: number, r: number, score: number) {
  const color = scoreColor(score);
  const steps = 60;
  const fraction = score / 100;

  // BG circle (thin arc)
  pdf.setDrawColor(...C.border);
  pdf.setLineWidth(2.5);
  pdf.circle(cx, cy, r, "S");

  // Foreground arc
  pdf.setDrawColor(...color);
  pdf.setLineWidth(2.5);

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + fraction * 2 * Math.PI;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (i / steps) * (endAngle - startAngle);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  for (let i = 0; i < pts.length - 1; i++) {
    pdf.line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
  }
}

// Helper: draw horizontal progress bar
function drawBar(pdf: jsPDF, x: number, y: number, w: number, h: number, score: number) {
  // BG
  pdf.setFillColor(...C.border);
  pdf.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  // Fill
  const fillW = (score / 100) * w;
  if (fillW > 0) {
    pdf.setFillColor(...scoreColor(score));
    pdf.roundedRect(x, y, fillW, h, h / 2, h / 2, "F");
  }
}

// Helper: wrap text to fit width, returns lines
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(text, maxWidth);
}

export function generatePDF(report: Report) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();   // 210
  const pageH = pdf.internal.pageSize.getHeight();  // 297
  const margin = 14;
  const contentW = pageW - margin * 2;

  let y = 0; // cursor

  // ── Helper: new page if needed ──────────────────
  function checkPage(needed: number) {
    if (y + needed > pageH - 14) {
      pdf.addPage();
      // Dark background for new page
      pdf.setFillColor(...C.bg);
      pdf.rect(0, 0, pageW, pageH, "F");
      y = 14;
    }
  }

  // ── 1. Background ───────────────────────────────
  pdf.setFillColor(...C.bg);
  pdf.rect(0, 0, pageW, pageH, "F");

  // ── 2. Header bar ───────────────────────────────
  pdf.setFillColor(...C.card);
  pdf.rect(0, 0, pageW, 20, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...C.accent);
  pdf.text("SiteAudit", margin, 13);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textMut);
  const ts = new Date(report.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  pdf.text(`Report generated ${ts}`, pageW - margin, 13, { align: "right" });

  y = 28;

  // ── 3. Domain title ─────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(...C.textPri);
  pdf.text(report.domain, margin, y);

  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.textSec);
  pdf.text(`${report.summary.totalChecks} checks  ·  ${report.summary.passed} passed  ·  ${report.summary.warnings} warnings  ·  ${report.summary.failures} failures`, margin, y);

  y += 10;

  // ── 4. Overall Score Card ───────────────────────
  const scoreCardH = 42;
  roundedRect(pdf, margin, y, contentW, scoreCardH, 4, C.card, C.border);

  // Ring
  const ringCX = margin + 26;
  const ringCY = y + scoreCardH / 2;
  drawScoreRing(pdf, ringCX, ringCY, 14, report.overall.score);

  // Score number
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...scoreColor(report.overall.score));
  pdf.text(String(report.overall.score), ringCX, ringCY + 1.5, { align: "center" });

  // Grade below number
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...C.textMut);
  pdf.text(report.overall.grade, ringCX, ringCY + 7, { align: "center" });

  // Status + summary
  const textX = margin + 46;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...C.textPri);
  pdf.text(report.overall.status, textX, ringCY - 4);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...C.textSec);
  pdf.text("Overall Website Health Score", textX, ringCY + 2);

  y += scoreCardH + 6;

  // ── 5. Category Cards (2 per row) ───────────────
  const cats = Object.entries(report.categories);
  const colW = (contentW - 4) / 2;
  const catH = 28;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textMut);
  pdf.text("CATEGORY SCORES", margin, y);
  y += 4;

  for (let i = 0; i < cats.length; i++) {
    const [name, data] = cats[i];
    const col = i % 2;
    const cx = margin + col * (colW + 4);

    if (col === 0 && i > 0) y += catH + 3;
    checkPage(catH + 6);

    roundedRect(pdf, cx, y, colW, catH, 3, C.card, C.border);

    // Name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...C.textSec);
    pdf.text(name.toUpperCase(), cx + 6, y + 8);

    // Score number
    const sColor = scoreColor(data.score);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...sColor);
    pdf.text(String(data.score), cx + colW - 6, y + 9, { align: "right" });

    // Progress bar
    drawBar(pdf, cx + 6, y + 14, colW - 12, 2.5, data.score);

    // Stats
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);

    pdf.setTextColor(...C.green);
    pdf.text(`✓ ${data.passed}`, cx + 6, y + 22);

    pdf.setTextColor(...C.yellow);
    pdf.text(`⚠ ${data.warnings}`, cx + 22, y + 22);

    pdf.setTextColor(...C.red);
    pdf.text(`✗ ${data.failures}`, cx + 36, y + 22);
  }

  y += catH + 10;

  // ── 6. Priority Issues ──────────────────────────
  checkPage(20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textMut);
  pdf.text("PRIORITY ISSUES", margin, y);

  const badge = { w: 14, h: 5 };

  y += 4;

  for (const issue of report.priorityIssues) {
    const recLines = issue.recommendation
      ? wrapText(pdf, `→ ${issue.recommendation}`, contentW - badge.w - 12)
      : [];
    const rowH = 10 + recLines.length * 4 + 4;
    checkPage(rowH + 2);

    // Row BG
    roundedRect(pdf, margin, y, contentW, rowH, 2, C.card, C.border);

    // Severity badge
    const bg = severityBg(issue.severity) as [number,number,number,number];
    const fg = severityColor(issue.severity);
    pdf.setFillColor(bg[0], bg[1], bg[2]);
    pdf.roundedRect(margin + 4, y + 3.5, badge.w, badge.h, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(...fg);
    pdf.text(issue.severity.toUpperCase(), margin + 4 + badge.w / 2, y + 3.5 + badge.h / 2 + 0.5, { align: "center" });

    // Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C.textPri);
    const titleLines = wrapText(pdf, issue.title, contentW - badge.w - 20);
    pdf.text(titleLines, margin + badge.w + 9, y + 7.5);

    // Category tag (right-aligned)
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.textMut);
    pdf.text(issue.category.toUpperCase(), margin + contentW - 4, y + 7, { align: "right" });

    // Recommendation
    if (recLines.length > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.textSec);
      pdf.text(recLines, margin + badge.w + 9, y + 7.5 + titleLines.length * 4 + 1);
    }

    y += rowH + 2;
  }

  y += 6;

  // ── 7. What's Good ──────────────────────────────
  checkPage(20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...C.textMut);
  pdf.text("WHAT'S GOOD", margin, y);
  y += 4;

  const colCount = 2;
  const posColW = (contentW - 4) / colCount;
  const posPerCol = Math.ceil(report.positives.length / colCount);
  const rowH2 = 7;

  for (let col = 0; col < colCount; col++) {
    const items = report.positives.slice(col * posPerCol, (col + 1) * posPerCol);
    let rowY = y;
    for (const p of items) {
      checkPage(rowH2 + 1);
      const px = margin + col * (posColW + 4);

      roundedRect(pdf, px, rowY, posColW, rowH2, 2, C.card, C.border);

      // Green checkmark
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.green);
      pdf.text("✓", px + 4, rowY + 4.8);

      // Text
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...C.textSec);
      const pLines = wrapText(pdf, p, posColW - 12);
      pdf.text(pLines[0], px + 10, rowY + 4.8);

      rowY += rowH2 + 2;
    }
  }

  // ── 8. Footer on last page ──────────────────────
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
