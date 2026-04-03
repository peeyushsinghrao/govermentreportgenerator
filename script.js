'use strict';

/* =========================================================
   CONSTANTS
   ========================================================= */
const KARYA_NAMES = [
  "ओपीडी",
  "प्रकृति परीक्षण",
  "आयुष सुविधा में पेनलबद्ध व्यक्तियों की संख्या",
  "उच्च रक्तचाप हेतु परीक्षित 30 वर्ष से अधिक आयु के व्यक्तियों का अनुपात",
  "मधुमेह हेतु परीक्षित 30 वर्ष से अधिक आयु के व्यक्तियों का अनुपात",
  "मधुमेह हेतु परीक्षित 30 वर्ष से अधिक आयु के व्यक्तियों का अनुपात",
  "आयुष उपचार पा रहे उच्च रक्तचाप रोगियों का अनुपात",
  "जीवनशैली में परिवर्तन हेतु वर्ष में 06, सात दिवसीय अभियान",
  "परिवारों को वितरित ब्रोशर",
  "जनता की भागीदारी वाली अंतक्षेत्रीय बैठकों का आयोजन / भागीदारी",
];

const PAD_BASE = { AMO: 5000, 'नर्स/कम्पा': 2000, ANM: 2000, ASHA: 1000 };

const MONTHS = [
  "जनवरी","फरवरी","मार्च","अप्रैल","मई","जून",
  "जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"
];

const currentYear = new Date().getFullYear();

/* =========================================================
   STATE
   ========================================================= */
let state = {
  ahwcName: '',
  jila: '',
  maah: 'फरवरी',
  varsh: String(currentYear),
  // rows: [{lakshya:'', prapti:''}] × 10
  rows: Array.from({length: 10}, () => ({lakshya:'', prapti:''})),
  // karmachari: [{naam,pad,bank_khataa,bank_naam,ifsc,mobile}]
  karmachari: Array.from({length: 5}, () => ({naam:'',pad:'',bank_khataa:'',bank_naam:'',ifsc:'',mobile:''})),
};

/* =========================================================
   CALCULATIONS
   ========================================================= */
function calcPercent(lakshya, prapti) {
  const l = parseFloat(lakshya), p = parseFloat(prapti);
  if (!l || isNaN(l) || l === 0 || isNaN(p)) return 0;
  return Math.round((p / l) * 10000) / 100;
}

function calcRashi(pct) {
  if (pct < 31) return 0;
  if (pct <= 50) return Math.round((pct / 100) * 500);
  if (pct <= 70) return Math.round(0.75 * 500);
  return 500;
}

function getPercentArr() {
  return state.rows.map(r => calcPercent(r.lakshya, r.prapti));
}
function getRashiArr() {
  return getPercentArr().map(p => calcRashi(p));
}
function getTotalRashi() {
  return getRashiArr().reduce((s, v) => s + v, 0);
}
function getPerformancePct() {
  return Math.round((getTotalRashi() / 5000) * 10000) / 100;
}
function getPayment(pad) {
  const base = PAD_BASE[pad] || 0;
  return Math.round((getPerformancePct() / 100) * base);
}

function inr(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

/* =========================================================
   RENDER HELPERS
   ========================================================= */
function padOptions(selected) {
  const opts = ['','AMO','ANM','ASHA','नर्स/कम्पा'];
  const labels = {'':'-- चुनें --','AMO':'AMO','ANM':'ANM','ASHA':'ASHA','नर्स/कम्पा':'नर्स/कम्पा'};
  return opts.map(v =>
    `<option value="${v}"${v === selected ? ' selected' : ''}>${labels[v]}</option>`
  ).join('');
}

/* =========================================================
   FORM TABLE 1 RENDER
   ========================================================= */
function renderKaryaTable() {
  const pcts = getPercentArr(), rashis = getRashiArr(), total = getTotalRashi(), perf = getPerformancePct();
  const tbody = state.rows.map((row, i) => `
    <tr>
      <td class="sno">${i+1}</td>
      <td class="karya-name">${KARYA_NAMES[i]}</td>
      <td><input type="number" min="0" value="${row.lakshya}" data-row="${i}" data-field="lakshya" placeholder="0"></td>
      <td><input type="number" min="0" value="${row.prapti}" data-row="${i}" data-field="prapti" placeholder="0"></td>
      <td class="pct-cell">${pcts[i].toFixed(2)}%</td>
      <td class="rashi-cell">₹${rashis[i]}</td>
    </tr>`).join('');
  const tfoot = `<tr>
    <td colspan="5" style="text-align:right;font-weight:700;padding:6px 8px">
      कुल: ₹${total} / ₹5000 &nbsp;|&nbsp; प्रदर्शन: ${perf.toFixed(2)}%
    </td>
    <td style="font-weight:700;color:var(--green)">₹${total}</td>
  </tr>`;
  document.getElementById('karya-tbody').innerHTML = tbody;
  document.getElementById('karya-tfoot').innerHTML = tfoot;
}

/* =========================================================
   FORM TABLE 2 RENDER
   ========================================================= */
function renderKarmachariTable() {
  const total = state.karmachari.reduce((s, r) => s + getPayment(r.pad), 0);
  const tbody = state.karmachari.map((row, i) => `
    <tr>
      <td class="sno">${i+1}</td>
      <td><input type="text" value="${esc(row.naam)}" data-ki="${i}" data-kf="naam" placeholder="नाम दर्ज करें" style="text-align:left"></td>
      <td><select data-ki="${i}" data-kf="pad">${padOptions(row.pad)}</select></td>
      <td><input type="text" value="${esc(row.bank_khataa)}" data-ki="${i}" data-kf="bank_khataa" placeholder="खाता संख्या"></td>
      <td><input type="text" value="${esc(row.bank_naam)}" data-ki="${i}" data-kf="bank_naam" placeholder="बैंक नाम" style="text-align:left"></td>
      <td><input type="text" value="${esc(row.ifsc)}" data-ki="${i}" data-kf="ifsc" placeholder="IFSC" style="text-transform:uppercase"></td>
      <td><input type="tel" value="${esc(row.mobile)}" data-ki="${i}" data-kf="mobile" placeholder="मोबाइल"></td>
      <td class="rashi-cell">${inr(getPayment(row.pad))}</td>
      <td><button class="rm-btn" data-del="${i}" ${state.karmachari.length <= 1 ? 'disabled' : ''}>✕</button></td>
    </tr>`).join('');
  const tfoot = `<tr>
    <td colspan="7" style="text-align:right;font-weight:700;padding:6px 8px">कुल भुगतान:</td>
    <td style="font-weight:700;color:var(--green)">${inr(total)}</td>
    <td></td>
  </tr>`;
  document.getElementById('karma-tbody').innerHTML = tbody;
  document.getElementById('karma-tfoot').innerHTML = tfoot;
}

function esc(s) { return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

/* =========================================================
   DOCUMENT PREVIEW RENDER
   ========================================================= */
function renderPreview() {
  const pcts = getPercentArr(), rashis = getRashiArr(), total = getTotalRashi(), perf = getPerformancePct();

  // Header info
  document.getElementById('doc-ahwc').textContent = state.ahwcName || '________________________';
  document.getElementById('doc-jila').textContent = state.jila || '____________';
  document.getElementById('doc-maah').textContent = `${state.maah} ${state.varsh}`;
  document.getElementById('doc-sig-ahwc').textContent = state.ahwcName || '______________';
  document.getElementById('doc-certify-maah').textContent = `${state.maah} ${state.varsh}`;

  // Table 1
  const t1rows = state.rows.map((row, i) => `
    <tr>
      <td style="text-align:center">${i+1}</td>
      <td style="text-align:left;font-size:.68rem">${KARYA_NAMES[i]}</td>
      <td style="text-align:center">${row.lakshya || '—'}</td>
      <td style="text-align:center">${row.prapti || '—'}</td>
      <td style="text-align:center;font-weight:600">${pcts[i].toFixed(2)}%</td>
      <td style="text-align:center;font-weight:600">₹${rashis[i]}</td>
    </tr>`).join('');
  const t1foot = `<tr class="doc-tbl-foot">
    <td colspan="4" style="text-align:right;font-size:.7rem">
      कुल प्रदर्शन राशि: ₹${total} / ₹5000 &nbsp;|&nbsp; प्रदर्शन प्रतिशत: ${perf.toFixed(2)}%
    </td>
    <td colspan="2" style="text-align:center;font-weight:700">₹${total}</td>
  </tr>`;
  document.getElementById('doc-t1-body').innerHTML = t1rows;
  document.getElementById('doc-t1-foot').innerHTML = t1foot;

  // Table 2
  const kTotal = state.karmachari.reduce((s, r) => s + getPayment(r.pad), 0);
  const t2rows = state.karmachari.map((row, i) => `
    <tr>
      <td style="text-align:center">${i+1}</td>
      <td style="text-align:left">${row.naam || '________________'}</td>
      <td style="text-align:center;font-weight:600">${row.pad || '—'}</td>
      <td style="text-align:center">${row.bank_khataa || '____________'}</td>
      <td style="text-align:left">${row.bank_naam || '____________'}</td>
      <td style="text-align:center">${row.ifsc || '________'}</td>
      <td style="text-align:center">${row.mobile || '__________'}</td>
      <td style="text-align:center;font-weight:600">${inr(getPayment(row.pad))}</td>
    </tr>`).join('');
  const t2foot = `<tr class="doc-tbl-foot">
    <td colspan="7" style="text-align:right;font-size:.68rem">कुल भुगतान राशि:</td>
    <td style="text-align:center;font-weight:700">${inr(kTotal)}</td>
  </tr>`;
  document.getElementById('doc-t2-body').innerHTML = t2rows;
  document.getElementById('doc-t2-foot').innerHTML = t2foot;
}

function renderAll() {
  renderKaryaTable();
  renderKarmachariTable();
  renderPreview();
}

/* =========================================================
   EVENT DELEGATION — FORM INPUTS
   ========================================================= */
document.getElementById('karya-tbody').addEventListener('input', e => {
  const el = e.target;
  const row = el.dataset.row, field = el.dataset.field;
  if (row === undefined || !field) return;
  state.rows[+row][field] = el.value;
  renderAll();
});

document.getElementById('karma-tbody').addEventListener('input', e => {
  const el = e.target;
  const ki = el.dataset.ki, kf = el.dataset.kf;
  if (ki === undefined || !kf) return;
  let val = el.value;
  if (kf === 'ifsc') val = val.toUpperCase();
  state.karmachari[+ki][kf] = val;
  if (kf === 'ifsc') el.value = val;
  renderAll();
});

document.getElementById('karma-tbody').addEventListener('change', e => {
  const el = e.target;
  const ki = el.dataset.ki, kf = el.dataset.kf;
  if (ki === undefined || !kf) return;
  state.karmachari[+ki][kf] = el.value;
  renderAll();
});

document.getElementById('karma-tbody').addEventListener('click', e => {
  const btn = e.target.closest('.rm-btn');
  if (!btn) return;
  const idx = +btn.dataset.del;
  if (state.karmachari.length <= 1) return;
  state.karmachari.splice(idx, 1);
  renderAll();
});

/* =========================================================
   HEADER INPUTS
   ========================================================= */
document.getElementById('ahwc-name').addEventListener('input', e => { state.ahwcName = e.target.value; renderPreview(); });
document.getElementById('jila').addEventListener('input', e => { state.jila = e.target.value; renderPreview(); });
document.getElementById('maah').addEventListener('change', e => { state.maah = e.target.value; renderPreview(); });
document.getElementById('varsh').addEventListener('change', e => { state.varsh = e.target.value; renderPreview(); });

/* ADD ROW */
document.getElementById('add-karma-btn').addEventListener('click', () => {
  state.karmachari.push({naam:'',pad:'',bank_khataa:'',bank_naam:'',ifsc:'',mobile:''});
  renderAll();
});

/* =========================================================
   POPULATE DROPDOWNS ON LOAD
   ========================================================= */
(function initDropdowns() {
  const maahSel = document.getElementById('maah');
  MONTHS.forEach(m => {
    const o = document.createElement('option');
    o.value = m; o.textContent = m;
    if (m === 'फरवरी') o.selected = true;
    maahSel.appendChild(o);
  });

  const varshSel = document.getElementById('varsh');
  for (let y = currentYear - 2; y <= currentYear + 3; y++) {
    const o = document.createElement('option');
    o.value = y; o.textContent = y;
    if (y === currentYear) o.selected = true;
    varshSel.appendChild(o);
  }
})();

/* =========================================================
   PDF GENERATION
   ========================================================= */
document.getElementById('btn-pdf').addEventListener('click', async () => {
  const ahwc = state.ahwcName.trim(), jila = state.jila.trim();
  let errs = [];
  if (!ahwc) errs.push('AHWC का नाम आवश्यक है');
  if (!jila) errs.push('जिला आवश्यक है');
  const errBox = document.getElementById('err-box');
  if (errs.length) {
    errBox.innerHTML = errs.map(e => `<div>⚠️ ${e}</div>`).join('');
    errBox.style.display = 'block';
    return;
  }
  errBox.style.display = 'none';

  const overlay = document.getElementById('overlay');
  overlay.classList.add('active');

  try {
    await new Promise(r => setTimeout(r, 200));
    const element = document.getElementById('doc-page');
    const opt = {
      margin: [4, 4, 4, 4],
      filename: `AHWC_PLP_Report_${state.maah}_${state.varsh}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' },
    };
    await html2pdf().set(opt).from(element).save();
  } finally {
    overlay.classList.remove('active');
  }
});

/* =========================================================
   INITIAL RENDER
   ========================================================= */
renderAll();
