import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { detectAndDecode, estimateManufacture, formatYearMonth, modelWindows } from '../docs/assets/decoder.js';

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
const recordsFor = (model) => payload.models.filter((record) => record.model === model);
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

const html = await fs.readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
const app = await fs.readFile(new URL('../docs/assets/app.js', import.meta.url), 'utf8');
assert.match(html, /id="model"/);
assert.match(html, /id="serial"/);
assert.doesNotMatch(html, /id="country"|id="label"|id="screw"|id="adapter"|id="ic"|id="pcb"|id="notes"/);
assert.doesNotMatch(app, /信頼度|判定根拠|buildExternalSearchLinks/);
assert.match(app, /販売期間との整合性：あり/);
assert.match(app, /販売期間とシリアルが矛盾しています/);
assert.match(app, /特殊な流通個体/);
assert.match(app, /型式入力エラー/);
assert.match(app, /シリアル入力エラー/);
assert.match(html, /制作・運営：RETUNE WORKS/);
assert.match(html, /本サイトはRoland／BOSS公式ではありません。表示される製造年月は、公開情報と実機調査をもとにした非公式の推定です。/);
assert.match(html, /特定のシリアルが実際に発行されたこと、製品の真贋、シリアルラベルの交換の有無を保証するものではありません。/);

console.log('decoder, compatibility, validation, and interface tests passed');
