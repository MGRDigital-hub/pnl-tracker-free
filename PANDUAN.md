# P/L Tracker Free: Panduan

Jejak untung rugi bisnes online anda: ads, sales, kos barang (COGS) dan RTS, dalam satu app. Percuma, tanpa akaun, tanpa Google Sheet.

## Cara buka

- **Offline:** simpan fail `index.html`, kemudian klik dua kali. Boleh buka dalam Chrome, Edge, Safari atau Firefox, di komputer atau telefon.
- **Pautan web:** buka pautan yang diberi, kemudian pilih "Add to Home Screen" untuk pasang seperti app.

Data disimpan **dalam browser anda sahaja**. Tiada siapa lain nampak. Ini juga bermaksud: jika anda bersihkan data browser atau tukar komputer, data hilang kecuali anda ada backup.

## Mula dalam 3 langkah

1. **Produk:** tambah produk dan pakej, dengan kos (COGS) setiap pakej. Contoh: Pakej 1 (1 botol) kos RM15.
2. **Rekod Harian:** setiap hari isi ads, sales, order, visitor dan berapa pakej terjual. Satu borang sahaja, tak perlu isi dua kali.
3. **Dashboard:** lihat Net Profit, ROAS, kadar RTS dan kemajuan target bulanan.

Nak cuba dahulu? Tekan "Cuba dengan data contoh" di Dashboard, kemudian padam di Tetapan.

## Formula

| Angka | Cara kira |
|---|---|
| Ads + fee | Ads × (1 + fee). Fee lalai 8%, boleh tukar di Tetapan |
| ROAS | Sales ÷ Ads+fee |
| ROAS pulang modal | Sales ÷ (Sales − COGS). Bawah ini, iklan rugi |
| AOV / CPP / CR | Sales ÷ Order / Ads+fee ÷ Order / Order ÷ Visitor |
| Untung kasar | Sales − COGS |
| Kerugian RTS | COGS barang hangus + kos pos hangus |
| **Net Profit** | **Sales − COGS − Ads+fee − Kerugian RTS** |

Penting:
- Isi **Sales dan Qty untuk order yang berjaya sahaja**. Order yang di-RTS dimasukkan di menu **Return / RTS**.
- Letak COGS 0 pada return jika barang boleh dijual semula.
- Kadar RTS = unit dipulangkan ÷ (unit berjaya + unit dipulangkan).
- COGS dan fee disimpan pada setiap rekod, jadi tukar kos kemudian tidak mengubah sejarah.

## Backup (wajib)

Tetapan → **Muat turun backup**. Simpan fail `.json` di tempat selamat (Google Drive, emel sendiri). Untuk pulihkan: Tetapan → Pulihkan dari backup. App akan ingatkan jika sudah 14 hari tiada backup.

## Pindah dari P/L Tracker Pro (Google Sheet)

Dalam Google Sheet lama, muat turun tab **Products, ProductReport, GrossProfit, ProductReturn** sebagai CSV (File → Download → CSV). Kemudian di app ini: Tetapan → Import → pilih keempat-empat fail sekali gus.

## Untuk pemilik (hosting)

Folder ini ialah laman statik. Letak di mana-mana hosting percuma (Cloudflare Pages, Netlify Drop, GitHub Pages) dengan menyeret folder `pnl-tracker-free`. `sw.js` dan `manifest.webmanifest` membolehkan pemasangan sebagai app dan guna tanpa internet. Untuk edar sebagai fail, `index.html` sahaja sudah cukup.

Ujian enjin kiraan: `node tests/engine.test.js`.
