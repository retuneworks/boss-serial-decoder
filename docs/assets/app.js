import { estimateManufacture, formatYearMonth } from './decoder.js';
import { getLanguage } from './i18n.js';

const state = { records: [], lastView: null, formMessage: null };
const $ = (selector) => document.querySelector(selector);

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function normalizeModel(value = '') {
  return String(value).normalize('NFKC').trim().toUpperCase().replace(/[\s‐‑‒–—―ーｰ-]+/g, '');
}

function uniqueModels(records) {
  const models = new Map();
  for (const record of records) {
    if (!record.model) continue;
    const key = normalizeModel(record.model);
    if (!models.has(key)) models.set(key, { model: record.model, name: record.name || record.effectType || '' });
  }
  return [...models.values()].sort((a, b) => a.model.localeCompare(b.model, 'en', { numeric: true }));
}

function canonicalModel(input) {
  const normalized = normalizeModel(input);
  return state.records.find((item) => normalizeModel(item.model) === normalized)?.model || '';
}

function recordsForModel(model) {
  const normalized = normalizeModel(model);
  return state.records.filter((record) => normalizeModel(record.model) === normalized);
}

function localized(ja, en) { return getLanguage() === 'en' ? en : ja; }
function showMessage(ja = '', en = '') {
  state.formMessage = ja || en ? { ja, en } : null;
  $('#form-message').textContent = localized(ja, en);
}
function hideResult() {
  const panel = $('#result-panel');
  panel.hidden = true;
  panel.className = 'result-card';
  panel.innerHTML = '';
  state.lastView = null;
}

function renderError(titleJa, titleEn, messageJa, messageEn, shouldScroll = true) {
  const panel = $('#result-panel');
  state.lastView = { type: 'error', titleJa, titleEn, messageJa, messageEn };
  panel.hidden = false;
  panel.className = 'result-card result-error';
  panel.innerHTML = `<p class="result-label">${escapeHtml(localized(titleJa, titleEn))}</p><p class="result-message">${escapeHtml(localized(messageJa, messageEn))}</p>`;
  if (shouldScroll) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function compatibilityText(status) {
  if (status === 'consistent') return {
    className: 'result-consistent',
    label: localized('販売期間との整合性：あり', 'Sales-period compatibility: MATCH'),
    note: localized('推定製造年月は、登録されている販売期間内です。', 'The estimated manufacture date falls within the registered sales period.')
  };
  if (status === 'inconsistent') return {
    className: 'result-inconsistent',
    label: localized('販売期間との整合性：なし', 'Sales-period compatibility: CONFLICT'),
    note: localized('販売期間とシリアルが矛盾しています。型式・シリアルの誤入力、登録データの不足、特殊な流通個体、シリアルラベルの交換などの可能性があります。', 'The sales period and serial number conflict. Possible causes include an input error, incomplete registered data, unusual distribution, or a replaced serial label.')
  };
  return {
    className: 'result-unknown',
    label: localized('販売期間との整合性：確認不能', 'Sales-period compatibility: UNAVAILABLE'),
    note: localized('販売期間データが不足しているため、整合性を確認できません。', 'Compatibility cannot be checked because sales-period data is incomplete.')
  };
}

function renderResult(result, shouldScroll = true) {
  const panel = $('#result-panel');
  const compatibility = compatibilityText(result.compatibility);
  state.lastView = { type: 'result', result };
  panel.hidden = false;
  panel.className = `result-card ${compatibility.className}`;
  panel.innerHTML = `
    <p class="result-label">${escapeHtml(localized('推定製造年月', 'Estimated manufacture date'))}</p>
    <p class="result-date">${escapeHtml(getLanguage() === 'en' ? `${result.date.year}-${String(result.date.month).padStart(2, '0')}` : formatYearMonth(result.date))}</p>
    <div class="compatibility-status">
      <p class="compatibility-label">${escapeHtml(compatibility.label)}</p>
      <p class="compatibility-note">${escapeHtml(compatibility.note)}</p>
    </div>`;
  if (shouldScroll) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function serialErrorMessage(error) {
  if (error === 'reserved-o') return ['製造年月コードの位置に英字「O」は使用されないため、入力を確認してください。', 'The letter “O” is not used in the manufacture-date code position. Please check your entry.'];
  if (error === 'future-code') return ['現在より未来の製造年月を示すシリアルです。誤入力の可能性があります。', 'This serial indicates a manufacture date in the future. Please check your entry.'];
  if (error === 'out-of-era' || error === 'invalid-code') return ['シリアルの形式は似ていますが、対応する年代コードとして成立しません。入力を確認してください。', 'This resembles a serial number, but it cannot be decoded as a supported era code. Please check your entry.'];
  return ['対応していないシリアル形式です。桁数、英数字、0（ゼロ）とO（オー）を確認してください。', 'This serial format is not supported. Check the length, characters, and 0 (zero) versus O (letter O).'];
}

function updateUrl(model, serial) {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('model', model);
  url.searchParams.set('serial', serial);
  window.history.replaceState({}, '', url);
}

function estimateFromForm(event) {
  event?.preventDefault();
  hideResult();
  showMessage('');
  const modelInput = $('#model').value.trim();
  const serial = $('#serial').value.trim();
  const model = canonicalModel(modelInput);

  if (!modelInput) { $('#model').focus(); showMessage('型式を入力してください。', 'Enter a model.'); return; }
  if (!model) {
    $('#model').focus();
    renderError('型式入力エラー', 'Model input error', '登録されていない型式です。候補一覧から選ぶか、型式の表記を確認してください。', 'This model is not registered. Select a suggestion or check the model name.');
    return;
  }
  if (!serial) { $('#serial').focus(); showMessage('シリアルナンバーを入力してください。', 'Enter a serial number.'); return; }

  $('#model').value = model;
  const result = estimateManufacture({ serial, modelRecords: recordsForModel(model) });
  if (result.error || !result.date) {
    $('#serial').focus();
    const [messageJa, messageEn] = serialErrorMessage(result.error);
    renderError('シリアル入力エラー', 'Serial number input error', messageJa, messageEn);
    return;
  }

  updateUrl(model, result.serial);
  renderResult(result);
}

function resetForm() {
  $('#decoder-form').reset(); showMessage(''); hideResult();
  const url = new URL(window.location.href); url.search = ''; window.history.replaceState({}, '', url);
  $('#model').focus();
}

function refreshOutputLanguage() {
  if (state.formMessage) {
    $('#form-message').textContent = localized(state.formMessage.ja, state.formMessage.en);
  }
  if (state.lastView?.type === 'result') renderResult(state.lastView.result, false);
  if (state.lastView?.type === 'error') {
    const view = state.lastView;
    renderError(view.titleJa, view.titleEn, view.messageJa, view.messageEn, false);
  }
}

function fillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('model')) $('#model').value = params.get('model');
  if (params.get('serial')) $('#serial').value = params.get('serial');
  if (params.get('model') && params.get('serial')) estimateFromForm();
}

async function init() {
  try {
    const response = await fetch('./data/models.json');
    if (!response.ok) throw new Error('Failed to load model data');
    const payload = await response.json();
    state.records = payload.models || [];
    $('#model-list').innerHTML = uniqueModels(state.records)
      .map((item) => `<option value="${escapeHtml(item.model)}">${escapeHtml(item.name)}</option>`).join('');
    $('#decoder-form').addEventListener('submit', estimateFromForm);
    $('#reset-button').addEventListener('click', resetForm);
    window.addEventListener('site-language-change', refreshOutputLanguage);
    fillFromUrl();
  } catch (error) {
    console.error(error);
    showMessage('データを読み込めませんでした。ファイルを直接開かず、npm run devで起動してください。');
  }
}

init();
