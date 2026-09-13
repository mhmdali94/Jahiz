// The .pdf "generator" — per the spec, jsPDF is explicitly banned (Arabic
// shaping/RTL break badly in it). Instead this renders a real, clean HTML
// report into a dedicated print-only container and calls window.print(),
// so the browser's own text engine — which already gets Arabic right —
// produces the PDF when the client chooses "Save as PDF" in the print
// dialog. Same content as the .docx would have, minus the passwords page:
// this is a read-only summary for approval and records.

import { getVisibleSteps, PROJECT_TYPE_LIST } from '../schema/index.js';
import { prepareStepModel } from './prepareModel.js';
import { computeMissingItems, computeScopeSummary } from '../steps/review.js';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderQnaTable(rows) {
  if (!rows.length) return '';
  return `<table class="print-table"><thead><tr><th>البند</th><th>الإجابة</th><th>ملاحظات</th></tr></thead><tbody>
    ${rows.map((r) => `<tr class="${r.isUnknown ? 'is-unknown' : ''}"><td>${escapeHtml(r.itemAr)}</td><td>${escapeHtml(r.answer)}</td><td>${escapeHtml(r.notes)}</td></tr>`).join('')}
  </tbody></table>`;
}

function renderDataTable(table) {
  if (!table.rows.length) return '';
  return `<h4>${escapeHtml(table.titleAr)}</h4>
  <table class="print-table print-table--wide"><thead><tr>${table.columns.map((c) => `<th>${escapeHtml(c.labelAr)}</th>`).join('')}</tr></thead><tbody>
    ${table.rows.map((cells) => `<tr>${cells.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}
  </tbody></table>`;
}

function buildReportHtml(answers, version) {
  const projectTypeAr = PROJECT_TYPE_LIST.find((t) => t.value === answers.project_type)?.ar || 'غير محدد';
  const visibleSteps = getVisibleSteps(answers).filter((s) => s.id !== 'passwords');
  const missingItems = computeMissingItems(answers);
  const scope = computeScopeSummary(answers);
  const dateStr = new Date().toLocaleString('ar-SA');

  let missingHtml = '';
  if (missingItems.length) {
    missingHtml = `<section class="print-section"><h2>بنود ناقصة تحتاج إجراء</h2>
      <ul>${missingItems.map((i) => `<li>${escapeHtml(i.field.labelAr)}</li>`).join('')}</ul>
    </section>`;
  }

  const scopeHtml = `<section class="print-section"><h2>ما سنقوم به / خارج النطاق</h2>
    <div class="print-scope-cols">
      <div><h4>ما سنقوم به</h4><ul>${scope.inScope.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>
      <div><h4>خارج النطاق</h4><ul>${scope.outOfScope.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul></div>
    </div>
  </section>`;

  let sectionsHtml = '';
  for (const step of visibleSteps) {
    const { qnaRows, tables } = prepareStepModel(step, answers);
    const hasTableContent = tables.some((t) => t.rows.length > 0);
    if (!qnaRows.length && !hasTableContent) continue;
    sectionsHtml += `<section class="print-section"><h2>${escapeHtml(step.titleAr)}</h2>${renderQnaTable(qnaRows)}${tables.map(renderDataTable).join('')}</section>`;
  }

  return `
    <div class="print-cover">
      <h1>${escapeHtml(answers.company_name_ar || '')}</h1>
      <p>${escapeHtml(answers.company_name_en || '')}</p>
      <p>نوع المشروع: ${escapeHtml(projectTypeAr)}</p>
      <p>نسخة ${version} — ${dateStr}</p>
    </div>
    ${missingHtml}
    ${scopeHtml}
    ${sectionsHtml}
    <section class="print-section"><h2>قائمة تحقق للعميل</h2>
      <ul>
        <li>ملف الصور المضغوط (ZIP) — أرسله مع هذا المستند إن وُجدت صور.</li>
        <li>ملفات الشعار (فيكتور إن أمكن)</li>
        <li>الكتالوجات وأي ملفات PDF إضافية</li>
        <li>رابط Google Drive أو WeTransfer لأي ملف كبير لم يُرفع مباشرة</li>
      </ul>
    </section>
  `;
}

let printRoot;
function ensurePrintRoot() {
  if (!printRoot) {
    printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    document.body.appendChild(printRoot);
  }
  return printRoot;
}

/** Renders the report into the hidden print container and opens the browser's print dialog. */
export function openPrintView(answers, version) {
  const root = ensurePrintRoot();
  root.innerHTML = buildReportHtml(answers, version);
  window.print();
}

export { buildReportHtml }; // exported for the headless test — see scratch/test-pdf.mjs
