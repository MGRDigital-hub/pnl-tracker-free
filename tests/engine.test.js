// Jalankan: node tests/engine.test.js
// Enjin kiraan diambil terus dari index.html (antara penanda ENGINE-START / ENGINE-END).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = /\/\*ENGINE-START\*\/([\s\S]*?)\/\*ENGINE-END\*\//.exec(html);
assert.ok(m, 'penanda ENGINE tak dijumpai');
const Engine = new Function(m[1] + '; return Engine;')();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok  -', name); };
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg || ''} ${a} != ${b}`);

// --- data contoh (sama dengan mod simulasi P/L Tracker Pro lama) ---
const e1 = { date: '2026-06-01', productId: 'A', ads: 100, feeRate: 0.08, sales: 500, orders: 10, visitors: 500, items: [{ pkgId: 'P1', name: 'Trial', qty: 10, cogs: 15 }] };

t('entryMetrics: ads+fee, ROAS, CPP, CR, untung kasar', () => {
  const x = Engine.entryMetrics(e1);
  near(x.adsFee, 108); near(x.roas, 500 / 108); near(x.aov, 50); near(x.cpp, 10.8);
  near(x.cr, 0.02); near(x.cplv, 108 / 500);
  near(x.cogs, 150); near(x.gp, 350); near(x.gpMargin, 0.7); near(x.net, 242);
});

t('entryMetrics: pembahagi sifar tidak meletup', () => {
  const x = Engine.entryMetrics({ date: '2026-06-01', ads: 0, sales: 100, orders: 0, visitors: 0, items: [] });
  assert.equal(x.roas, 0); assert.equal(x.aov, 0); assert.equal(x.cpp, 0); assert.equal(x.cr, 0);
  near(x.gp, 100);
});

t('entryMetrics: feeRate lama dikekalkan, tiada feeRate = 8%', () => {
  near(Engine.entryMetrics({ ads: 100, feeRate: 0.06 }).adsFee, 106);
  near(Engine.entryMetrics({ ads: 100 }).adsFee, 108);
  near(Engine.entryMetrics({ ads: 100, feeRate: 0 }).adsFee, 100);
});

t('returnMetrics: COGS + pos', () => {
  const r = Engine.returnMetrics({ items: [{ qty: 2, cogs: 15 }], shipping: 5 });
  near(r.qty, 2); near(r.cogs, 30); near(r.shipping, 5); near(r.loss, 35);
});

t('summarize: Net Profit = Sales - COGS - Ads+fee - RTS (ads TIDAK dikira dua kali)', () => {
  const s = Engine.summarize([e1], [{ items: [{ qty: 2, cogs: 15 }], shipping: 5 }]);
  near(s.sales, 500); near(s.adsFee, 108); near(s.cogs, 150); near(s.retLoss, 35);
  near(s.netProfit, 500 - 150 - 108 - 35);
  near(s.netMargin, 207 / 500);
  near(s.returnRate, 2 / 12); // 2 pulang daripada 10 berjaya + 2 pulang
  near(s.adsWasted, 2 * 10.8); // maklumat sahaja
});

t('summarize: set kosong', () => {
  const s = Engine.summarize([], []);
  assert.equal(s.netProfit, 0); assert.equal(s.returnRate, 0); assert.equal(s.roas, 0);
});

t('breakEvenRoas: sales/(sales-cogs); pada ROAS ini untung lepas ads = 0', () => {
  const be = Engine.breakEvenRoas([e1]);
  near(be, 500 / 350);
  // jika ads+fee = sales/be maka gp - ads = 0
  near(500 - 150 - 500 / be, 0);
  assert.equal(Engine.breakEvenRoas([{ sales: 100, items: [{ qty: 10, cogs: 10 }] }]), null); // COGS >= sales
  assert.equal(Engine.breakEvenRoas([]), null);
});

t('roasLevel: ikut break-even, atau 1.5 / 3 jika tiada data', () => {
  assert.equal(Engine.roasLevel(1.2, 1.43), 'bad');
  assert.equal(Engine.roasLevel(1.9, 1.43), 'warn');
  assert.equal(Engine.roasLevel(2.3, 1.43), 'good');
  assert.equal(Engine.roasLevel(1, null), 'bad');
  assert.equal(Engine.roasLevel(2, null), 'warn');
  assert.equal(Engine.roasLevel(3.5, null), 'good');
});

t('tarikh: addDays merentas bulan/tahun/tahun lompat', () => {
  assert.equal(Engine.addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(Engine.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(Engine.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(Engine.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(Engine.diffDays('2026-06-01', '2026-06-05'), 4);
  assert.equal(Engine.diffDays('2026-03-01', '2026-04-01'), 31); // melintasi DST
});

t('previousRange: tempoh sama panjang sebelum ini', () => {
  assert.deepEqual(Engine.previousRange('2026-06-01', '2026-06-05'), { start: '2026-05-27', end: '2026-05-31' });
  assert.deepEqual(Engine.previousRange('2026-06-10', '2026-06-10'), { start: '2026-06-09', end: '2026-06-09' });
});

t('pctChange', () => {
  near(Engine.pctChange(150, 100), 0.5); near(Engine.pctChange(50, 100), -0.5);
  near(Engine.pctChange(-50, -100), 0.5);
  assert.equal(Engine.pctChange(10, 0), null);
});

t('monthProgress: bulan semasa, jangkaan dan perlu sehari', () => {
  const entries = [{ date: '2026-11-03', sales: 4000 }, { date: '2026-11-10', sales: 6000 }, { date: '2026-10-30', sales: 99999 }];
  const p = Engine.monthProgress(entries, 30000, '2026-11-24', '2026-11-24');
  near(p.sales, 10000); near(p.pct, 1 / 3); assert.equal(p.isCurrent, true);
  assert.equal(p.daysInMonth, 30); assert.equal(p.elapsed, 24); assert.equal(p.remaining, 6);
  near(p.projected, 10000 / 24 * 30); near(p.perDayNeeded, 20000 / 6);
});

t('monthProgress: bulan lepas, tiada jangkaan', () => {
  const p = Engine.monthProgress([{ date: '2026-10-05', sales: 500 }], 1000, '2026-10-31', '2026-11-24');
  assert.equal(p.isCurrent, false); near(p.projected, 500); assert.equal(p.perDayNeeded, 0); near(p.pct, 0.5);
});

t('monthProgress: target sifar tidak meletup', () => {
  const p = Engine.monthProgress([{ date: '2026-11-03', sales: 10 }], 0, '2026-11-24', '2026-11-24');
  assert.equal(p.pct, 0);
});

t('series: harian isi hari kosong', () => {
  const s = Engine.series([e1], '2026-06-01', '2026-06-03');
  assert.equal(s.length, 3); near(s[0].sales, 500); near(s[0].cost, 108 + 150); assert.equal(s[1].sales, 0);
});

t('series: julat panjang jadi bulanan', () => {
  const s = Engine.series([e1, { ...e1, date: '2026-08-15' }], '2026-06-01', '2026-08-31');
  assert.deepEqual(s.map(x => x.key), ['2026-06', '2026-07', '2026-08']);
  near(s[0].sales, 500); near(s[2].sales, 500); assert.equal(s[1].sales, 0);
});

t('series: julat songsang -> kosong', () => assert.deepEqual(Engine.series([], '2026-06-05', '2026-06-01'), []));

t('parseCSV: petikan, koma, baris baru dalam sel, BOM, CRLF', () => {
  const rows = Engine.parseCSV('﻿a,b,c\r\n1,"x,y","l1\nl2"\r\n"q""q",,3\r\n');
  assert.deepEqual(rows, [['a', 'b', 'c'], ['1', 'x,y', 'l1\nl2'], ['q"q', '', '3']]);
});

t('toCSV: escape petikan dan elak formula injection', () => {
  assert.equal(Engine.toCSV([['a"b', '=1+1', 5, null]]), '"a""b","\'=1+1","5",');
});

t('normDate: ISO, d/m/y, m/d/y, ambigu', () => {
  assert.deepEqual(Engine.normDate('2026-06-01'), { d: '2026-06-01', amb: false });
  assert.deepEqual(Engine.normDate('25/06/2026'), { d: '2026-06-25', amb: false });
  assert.deepEqual(Engine.normDate('6/25/2026'), { d: '2026-06-25', amb: false });
  assert.deepEqual(Engine.normDate('1/6/2026'), { d: '2026-06-01', amb: true });
  assert.deepEqual(Engine.normDate('5/5/2026'), { d: '2026-05-05', amb: false });
  assert.equal(Engine.normDate('bukan tarikh'), null);
});

t('importLegacy: gabung Report + GrossProfit, pakej, return', () => {
  let i = 0; const uid = () => 'id' + (++i);
  const tables = {
    Products: Engine.csvToObjects('ProductID,ProductName,Name_P1,COGS_P1,Name_P2,COGS_P2,Name_P3,COGS_P3,Name_P5,COGS_P5,Name_Extra,COGS_Extra\nX,Produk A,Trial,15,Combo,25,,,,,,'),
    ProductReport: Engine.csvToObjects('RecordID,Date,ProductName,AdsSpent,AdsFeeRate,Sales,Orders,Visitor,Remark\nr1,2026-06-01,Produk A,100,0.08,500,10,500,\nr2,2026-06-02,Produk A,200,0.08,1200,24,1000,'),
    GrossProfit: Engine.csvToObjects('RecordID,Date,ProductName,Sales,P1Qty,P1COGS,P2Qty,P2COGS,P3Qty,P3COGS,P5Qty,P5COGS,ExtraQty,ExtraCOGS,Remark\ng1,2026-06-01,Produk A,500,6,15,4,25,0,,0,,0,,\ng2,2026-06-05,Produk A,300,3,15,0,25,0,,0,,0,,'),
    ProductReturn: Engine.csvToObjects('RecordID,Date,ProductName,P1Qty,P1COGS,P2Qty,P2COGS,P3Qty,P3COGS,P5Qty,P5COGS,ExtraQty,ExtraCOGS,Remark\nt1,2026-06-03,Produk A,2,15,0,25,0,,0,,0,,Tak angkat call')
  };
  const r = Engine.importLegacy(tables, uid);
  assert.equal(r.products.length, 1); assert.equal(r.products[0].packages.length, 2);
  assert.equal(r.entries.length, 3); // 2 report + 1 GP tanpa report
  const d1 = r.entries.find(e => e.date === '2026-06-01');
  near(d1.ads, 100); near(d1.sales, 500); near(Engine.entryMetrics(d1).cogs, 6 * 15 + 4 * 25); // 190
  const d5 = r.entries.find(e => e.date === '2026-06-05');
  near(d5.sales, 300); near(d5.ads, 0); near(Engine.entryMetrics(d5).cogs, 45);
  assert.equal(r.returns.length, 1); near(Engine.returnMetrics(r.returns[0]).loss, 30);
  assert.equal(r.returns[0].remark, 'Tak angkat call');
  assert.deepEqual(r.warnings, []);
});

t('importLegacy: produk tiada dalam Products dicipta; amaran tarikh ambigu + Sales berbeza', () => {
  let i = 0; const uid = () => 'id' + (++i);
  const r = Engine.importLegacy({
    ProductReport: Engine.csvToObjects('Date,ProductName,AdsSpent,Sales,Orders,Visitor\n1/6/2026,Baru,50,300,3,100\nrosak,Baru,1,1,1,1'),
    GrossProfit: Engine.csvToObjects('Date,ProductName,Sales,P1Qty,P1COGS\n1/6/2026,Baru,250,3,20')
  }, uid);
  assert.equal(r.products.length, 1); assert.equal(r.products[0].packages[0].cogs, 20);
  assert.equal(r.entries.length, 1); near(r.entries[0].sales, 300); assert.equal(r.entries[0].date, '2026-06-01');
  assert.equal(r.warnings.length, 3);
});

console.log(`\n${n} ujian lulus`);
