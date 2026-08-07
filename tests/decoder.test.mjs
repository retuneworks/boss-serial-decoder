import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  classifyProductionCompatibility,
  detectAndDecode,
  estimateManufacture,
  formatYearMonth,
  modelWindows,
  productionPeriods
} from '../docs/assets/decoder.js';

const ym = (result) => result.candidates[0]
  ? `${result.candidates[0].year}-${String(result.candidates[0].month).padStart(2, '0')}`
  : null;

assert.equal(ym(detectAndDecode('7100')), '1978-06');
assert.equal(ym(detectAndDecode('141100')), '1982-01');
assert.equal(ym(detectAndDecode('875683')), '1988-02');
assert.equal(ym(detectAndDecode('JG83100')), '1994-11');
assert.equal(ym(detectAndDecode('A0A0000')), '2010-11');
assert.equal(ym(detectAndDecode('A0P0000')), '2022-07');
assert.equal(detectAndDecode('A0O0000').error, 'reserved-o');
assert.equal(detectAndDecode('12345').error, 'invalid-format');

const payload = JSON.parse(await fs.readFile(new URL('../docs/data/models.json', import.meta.url), 'utf8'));
const productionPayload = JSON.parse(await fs.readFile(new URL('../docs/data/production-periods.json', import.meta.url), 'utf8'));
const productionByModel = new Map(productionPayload.models.map((item) => [item.model, item]));
const recordsFor = (model) => payload.models
  .filter((record) => record.model === model)
  .map((record) => ({ ...record, productionCompatibility: productionByModel.get(model) || null }));
const now = new Date('2026-08-07T00:00:00Z');

const bf2 = estimateManufacture({ serial: '141100', modelRecords: recordsFor('BF-2'), now });
assert.equal(formatYearMonth(bf2.date), '1982年1月');
assert.equal(bf2.compatibility, 'consistent');

const od1Contradiction = estimateManufacture({ serial: 'JG83100', modelRecords: recordsFor('OD-1'), now });
assert.equal(formatYearMonth(od1Contradiction.date), '1994年11月');
assert.equal(od1Contradiction.compatibility, 'inconsistent');

const ds1Overseas = estimateManufacture({ serial: 'JG83100', modelRecords: recordsFor('DS-1'), now });
assert.equal(formatYearMonth(ds1Overseas.date), '1994年11月');
assert.equal(ds1Overseas.compatibility, 'consistent');

const future = estimateManufacture({ serial: 'A0Z0000', modelRecords: recordsFor('DS-1'), now });
assert.equal(future.error, 'future-code');

const fb2Windows = modelWindows(recordsFor('FB-2'));
assert.deepEqual(fb2Windows, [{ start: '2011-11', end: '2015-05' }]);
const anniversaryWindows = modelWindows(recordsFor('DS-1-4A'));
assert.deepEqual(anniversaryWindows, [{ start: '2017-01', end: '2017-12' }]);

const discrepancyCases = [
  ['CE-2', 1981, 'consistent'], ['CE-2', 1984, 'needs-review'], ['CE-2', 1995, 'inconsistent'],
  ['CS-2', 1984, 'consistent'], ['CS-2', 1987, 'needs-review'],
  ['NF-1', 1981, 'consistent'], ['NF-1', 1985, 'needs-review'],
  ['VB-2', 1983, 'consistent'], ['VB-2', 1985, 'needs-review'],
  ['OC-2', 2000, 'consistent'], ['OC-2', 2004, 'needs-review'],
  ['CE-3', 1988, 'consistent'], ['CE-3', 1991, 'needs-review'],
  ['DM-3', 1985, 'consistent'], ['DM-3', 1987, 'needs-review'],
  ['HF-2', 1990, 'consistent'], ['HF-2', 1994, 'needs-review'],
  ['PN-2', 1992, 'consistent'], ['PN-2', 1994, 'needs-review'],
  ['PW-2', 1997, 'consistent'], ['PW-2', 1998, 'needs-review'], ['PW-2', 1999, 'inconsistent'],
  ['PS-2', 1992, 'consistent'], ['PS-2', 1994, 'needs-review'],
  ['DC-3', 1991, 'consistent'], ['DC-3', 1993, 'needs-review'],
  ['OD-1', 1983, 'consistent'], ['OD-1', 1987, 'needs-review']
];
for (const [model, year, expected] of discrepancyCases) {
  const records = recordsFor(model);
  assert.equal(classifyProductionCompatibility({ year, month: 6 }, records), expected, `${model} ${year}`);
  assert.equal(productionPeriods(records).hasSourceDiscrepancy, true, `${model} discrepancy note`);
}

const correctedModelCases = [
  ['DD-7', 'A6I0000', '2018-01', 'consistent'],
  ['DD-7', 'A0L0000', '2020-01', 'inconsistent'],
  ['FRV-1', 'A2G0000', '2016-01', 'consistent'],
  ['FRV-1', 'A6I0000', '2018-01', 'inconsistent'],
  ['BC-2', 'A4D0000', '2013-09', 'consistent'],
  ['BC-2', 'A0F0000', '2015-01', 'inconsistent'],
  ['DA-2', 'A7C0000', '2013-02', 'consistent'],
  ['DA-2', 'A0F0000', '2015-01', 'inconsistent']
];
for (const [model, serial, expectedDate, compatibility] of correctedModelCases) {
  const result = estimateManufacture({ serial, modelRecords: recordsFor(model), now });
  assert.equal(ym({ candidates: [result.date] }), expectedDate, `${model} date`);
  assert.equal(result.compatibility, compatibility, `${model} compatibility`);
}
assert.equal(classifyProductionCompatibility({ year: 2013, month: 9 }, recordsFor('BC-2')), 'consistent');
assert.equal(classifyProductionCompatibility({ year: 2019, month: 12 }, recordsFor('DD-7')), 'consistent');
assert.equal(classifyProductionCompatibility({ year: 2020, month: 1 }, recordsFor('DD-7')), 'inconsistent');
assert.equal(recordsFor('DD-7')[0].saleEndYear, '2019');
assert.equal(recordsFor('FRV-1')[0].saleEndYear, '2017');
assert.equal(recordsFor('BC-2')[0].saleEndYear, '2014');
assert.equal(recordsFor('DA-2')[0].saleEnd, '2014-04');

const discrepancyModels = productionPayload.models.filter((item) => item.hasSourceDiscrepancy).map((item) => item.model).sort();
assert.deepEqual(discrepancyModels, ['CE-2', 'CE-3', 'CS-2', 'DC-3', 'DM-3', 'HF-2', 'NF-1', 'OC-2', 'OD-1', 'PN-2', 'PS-2', 'PW-2', 'VB-2']);
assert.ok(productionPayload.models.filter((item) => item.hasSourceDiscrepancy)
  .every((item) => item.discrepancyNote === '資料間で製造期間に差異があります。'));

const html = await fs.readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
const app = await fs.readFile(new URL('../docs/assets/app.js', import.meta.url), 'utf8');
assert.match(html, /id="model"/);
assert.match(html, /id="serial"/);
assert.doesNotMatch(html, /id="country"|id="label"|id="screw"|id="adapter"|id="ic"|id="pcb"|id="notes"/);
assert.doesNotMatch(app, /信頼度|判定根拠|buildExternalSearchLinks/);
assert.match(app, /整合性判定：✅ 整合性あり/);
assert.match(app, /整合性判定：⚠️ 要追加確認/);
assert.match(app, /製造可能期間とシリアルが矛盾しています/);
assert.match(app, /source-discrepancy/);
assert.match(app, /特殊な流通個体/);
assert.match(app, /型式入力エラー/);
assert.match(app, /シリアル入力エラー/);
assert.match(html, /制作・運営：RETUNE WORKS/);
assert.match(html, /判定結果は参考情報であり、正確性、完全性、最新性を保証するものではありません。/);
assert.match(html, /購入・販売・査定・鑑定・修理などの最終判断は、利用者ご自身の責任で行ってください。/);

const aboutHtml = await fs.readFile(new URL('../docs/about.html', import.meta.url), 'utf8');
assert.match(aboutHtml, /シリアルラベルの交換・貼り替え、修理歴、部品交換、仕様変更/);
assert.match(aboutHtml, /本サイト運営者は一切の責任を負いません。/);
assert.match(aboutHtml, /転載、引用、保存、加工、再利用、二次利用、商用利用/);
assert.match(aboutHtml, /運営者への許可や連絡は必要ありません。/);
assert.match(aboutHtml, /各メーカーとは関係のない独立した非公式の年代判別ツールです。/);
assert.doesNotMatch(aboutHtml, /リンクフリー/);

console.log('decoder, compatibility, validation, and interface tests passed');
