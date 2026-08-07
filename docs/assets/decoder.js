const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export function normalizeSerial(value = '') {
  return String(value).normalize('NFKC').trim().toUpperCase().replace(/[\s‐‑‒–—―ーｰ-]+/g, '');
}

export function parseYearMonth(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function monthIndex(year, month) {
  return year * 12 + (month - 1);
}

export function addMonths(year, month, delta) {
  const total = monthIndex(year, month) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function formatYearMonth(date) {
  if (!date) return '推定できませんでした';
  return `${date.year}年${MONTHS_JA[date.month - 1]}`;
}

function alphaIndex(char) { return char.charCodeAt(0) - 65; }

function betweenMonth(date, from, to) {
  if (!date) return false;
  const value = monthIndex(date.year, date.month);
  if (from) {
    const start = parseYearMonth(from);
    if (start && value < monthIndex(start.year, start.month)) return false;
  }
  if (to) {
    const end = parseYearMonth(to);
    if (end && value > monthIndex(end.year, end.month)) return false;
  }
  return true;
}

function monthString(date) {
  return date ? `${date.year}-${String(date.month).padStart(2, '0')}` : null;
}

function extractYearMonths(value = '') {
  const text = String(value).normalize('NFKC');
  const found = [];
  const add = (year, month) => {
    const date = { year: Number(year), month: Number(month) };
    if (date.month < 1 || date.month > 12) return;
    const key = monthString(date);
    if (!found.some((item) => monthString(item) === key)) found.push(date);
  };
  for (const match of text.matchAll(/(\d{4})\s*年\s*(\d{1,2})\s*月/g)) add(match[1], match[2]);
  for (const match of text.matchAll(/(\d{4})-(\d{2})(?:-\d{2})?/g)) add(match[1], match[2]);
  return found;
}

export function modelWindows(records = []) {
  const windows = [];
  for (const record of records) {
    const original = String(record.originalSalePeriod || '');
    const originalDates = extractYearMonths(original);
    let startDate = parseYearMonth(record.saleStart || record.releaseDate) || originalDates[0] || null;
    let endDate = parseYearMonth(record.saleEnd);

    // DS-1は日本で販売休止期間があっても台湾生産と海外販売が継続していたため、
    // 型式とシリアルの整合性判定では世界向けの継続モデルとして扱う。
    if (record.model === 'DS-1') {
      startDate = startDate || { year: 1978, month: 6 };
      endDate = null;
    } else if (!endDate) {
      const explicitlyCurrent = /現行|current/i.test(original);
      if (!explicitlyCurrent && originalDates.length >= 2) {
        endDate = originalDates[originalDates.length - 1];
      }
      if (!endDate && !explicitlyCurrent) {
        const limited = original.match(/(\d{4})\s*年[^。\n]*限定/);
        if (limited) endDate = { year: Number(limited[1]), month: 12 };
      }
      if (!endDate && !explicitlyCurrent && /^\d{4}$/.test(String(record.saleEndYear || ''))) {
        endDate = { year: Number(record.saleEndYear), month: 12 };
      }
    }

    if (startDate) windows.push({ start: monthString(startDate), end: monthString(endDate) });
  }

  const unique = new Map();
  for (const window of windows) unique.set(`${window.start}|${window.end || ''}`, window);
  return [...unique.values()];
}

function candidateFitsModel(date, records) {
  const windows = modelWindows(records);
  if (!windows.length) return null;
  return windows.some(({ start, end }) => betweenMonth(date, start, end));
}

function candidateDistanceFromModel(date, records) {
  const windows = modelWindows(records);
  if (!windows.length) return 0;
  const value = monthIndex(date.year, date.month);
  let best = Number.POSITIVE_INFINITY;
  for (const { start, end } of windows) {
    const startDate = parseYearMonth(start);
    const endDate = parseYearMonth(end);
    if (!startDate) continue;
    const startValue = monthIndex(startDate.year, startDate.month);
    const endValue = endDate ? monthIndex(endDate.year, endDate.month) : value;
    if (value >= startValue && value <= endValue) return 0;
    best = Math.min(best, Math.abs(value - startValue), Math.abs(value - endValue));
  }
  return best;
}

function decodeFourDigit(serial) {
  const code = Number(serial.slice(0, 2));
  const candidates = [];
  for (let cycle = 0; cycle < 4; cycle += 1) {
    const date = addMonths(1972, 7, code + cycle * 100);
    if (betweenMonth(date, '1977-01', '1981-03')) candidates.push(date);
  }
  return { format: '4-digit', candidates };
}

function decodeSixDigit(serial) {
  const code = Number(serial.slice(0, 2));
  const candidates = [];
  for (let cycle = 0; cycle < 3; cycle += 1) {
    const date = addMonths(1980, 11, code + cycle * 100);
    if (betweenMonth(date, '1980-11', '1989-02')) candidates.push(date);
  }
  return { format: '6-digit', candidates };
}

function decodeAlpha2FiveDigits(serial) {
  const offset = alphaIndex(serial[1]) * 10 + Number(serial[2]) - 1;
  const date = addMonths(1989, 4, offset);
  if (!betweenMonth(date, '1989-04', '2010-10')) {
    return { format: '2letters-5digits', candidates: [], error: 'out-of-era' };
  }
  return { format: '2letters-5digits', candidates: [date] };
}

function decodeCurrentSeven(serial) {
  if (serial[2] === 'O') {
    return { format: 'current-7', candidates: [], error: 'reserved-o' };
  }
  const digit = Number(serial[1]);
  const rawIndex = alphaIndex(serial[2]);
  const effectiveIndex = rawIndex > alphaIndex('O') ? rawIndex - 1 : rawIndex;
  const date = addMonths(2010, 11, effectiveIndex * 10 + digit);
  return { format: 'current-7', candidates: [date] };
}

export function detectAndDecode(serialValue) {
  const serial = normalizeSerial(serialValue);
  if (/^\d{4}$/.test(serial)) return { serial, ...decodeFourDigit(serial) };
  if (/^\d{6}$/.test(serial)) return { serial, ...decodeSixDigit(serial) };
  if (/^[A-Z]{2}\d{5}$/.test(serial)) return { serial, ...decodeAlpha2FiveDigits(serial) };
  if (/^[A-Z]\d[A-Z]\d{4}$/.test(serial)) return { serial, ...decodeCurrentSeven(serial) };
  return { serial, format: 'unknown', candidates: [], error: 'invalid-format' };
}

function chooseCandidate(candidates, records) {
  if (!candidates.length) return null;
  const all = [...new Map(candidates.map((date) => [monthString(date), date])).values()];
  const matching = all.filter((date) => candidateFitsModel(date, records) === true);
  const pool = matching.length ? matching : all;
  return [...pool].sort((a, b) => candidateDistanceFromModel(a, records) - candidateDistanceFromModel(b, records))[0];
}

function currentYearMonth(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function estimateManufacture({ serial, modelRecords = [], now = new Date() }) {
  const decoded = detectAndDecode(serial);
  if (decoded.error) {
    return { serial: decoded.serial, format: decoded.format, date: null, compatibility: null, error: decoded.error };
  }
  if (!decoded.candidates.length) {
    return { serial: decoded.serial, format: decoded.format, date: null, compatibility: null, error: 'invalid-code' };
  }

  const current = currentYearMonth(now);
  const nonFuture = decoded.candidates.filter((date) => monthIndex(date.year, date.month) <= monthIndex(current.year, current.month));
  if (!nonFuture.length) {
    return { serial: decoded.serial, format: decoded.format, date: null, compatibility: null, error: 'future-code' };
  }

  const date = chooseCandidate(nonFuture, modelRecords);
  const fits = candidateFitsModel(date, modelRecords);
  const compatibility = fits === null ? 'unknown' : fits ? 'consistent' : 'inconsistent';
  return { serial: decoded.serial, format: decoded.format, date, compatibility, error: null };
}
