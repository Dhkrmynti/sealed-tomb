# The Sealed Tomb ($TOMB) · konsep

Rebrand 9 Okt 2026 dari Robin Heist ($RBANK), sebelum $RBANK sempat di-launch (sebelumnya lagi: Pepads/$PADS). Mekanik engine, backend, fitur dan tokenomics tidak berubah; yang diganti hanya nama, ticker, lore dan UI.

> Status: situs siap (UI baru). Belum ada: launch $TOMB, domain, handle X. Konten X dan aset Remotion lama masih bertema Robin Heist dan perlu dibuat ulang.

---

## 1. Lore

**The Pharaoh** sedang membangun piramidanya. Tiap trade $TOMB meninggalkan **offering** (fee) di depan makam. Saat mangkuk persembahan cukup penuh, **rite** dijalankan: emasnya dibagikan ke **10 balok terbesar** yang duduk di **capstone** emas di puncak piramida. Siapa pun yang menjual dianggap merampok makam: **cursed**, baloknya dicabut dari piramida, selamanya.

- Tagline: **"what goes in the tomb stays in the tomb."**
- Sub-tagline: *"never sell."*
- Voice: degen CT santai, sedikit megah ("the rite ran. the capstone got paid.").
- Parodi, bukan lembaga keuangan. **Bukan** dividen, saham, atau investasi. Piramida di sini adalah makam, **bukan skema rekrutmen**: tidak ada yang dapat apa-apa karena mengajak orang lain. Disclaimer selalu tampil.

| Istilah | Arti di mesin |
|---|---|
| **offering** | creator fee (ETH) yang masuk ke escrow Pons |
| **the rite** | engine claim fee saat escrow mencapai ukuran langkah berikutnya |
| **the tribute** | langkah 1: 0.01 ETH dikirim sebagai ETH ke 10 balok terbesar, dibagi sesuai saldo |
| **builders' share** | langkah 2: 0.02 ETH ke treasury, dipamerkan terbuka |
| **into the afterlife** | langkah 3: 0.01 ETH buyback $TOMB lalu kirim ke 0x…dEaD |
| **sealed** | holder yang belum pernah jual dan saldonya ≥ minimum |
| **curing** | sealed, tapi $TOMB pertamanya belum melewati hold time |
| **loose stone** | holder di bawah minimum |
| **cursed** | wallet yang pernah jual → keluar permanen |
| **overseer** | curve, engine, treasury, dead address (tidak pernah dapat tribute) |
| **the capstone** | 10 balok terbesar |
| **the pyramid** | leaderboard di situs |
| **your block** | cek wallet di situs |
| **throne name** / **mask workshop** | nickname + avatar yang bisa diatur holder |
| **royal alias** | nama otomatis untuk wallet yang belum set nama |
| **the inscriptions** | riwayat semua rite + tx |

## 2. Maskot: the Pharaoh (original)

- Tiap holder memakai **topeng kerajaan** yang dirakit dari 4 bagian: material (emas, lapis, batu kapur, obsidian, perunggu), mahkota (kepala polos, nemes, mahkota biru, mahkota putih, mahkota ganda), regalia (tanpa, janggut palsu, kohl, uraeus, ankh, kalung lebar), latar (6 warna). Jumlah opsi 5/5/6/6 sengaja sama dengan validasi `MUGSHOT_PARTS` di backend.
- Logo: topeng emas dengan nemes bergaris lapis dan janggut palsu.
- **Bukan** replika topeng Tutankhamun, bukan firaun dari film/game, bukan karya proyek lain.

## 3. Visual

Lihat `DESIGN.md`. Ringkasnya: piramida yang sedang dibangun di siang terik (batu kapur, tanda tukang batu dari oker merah, capstone emas hanya untuk top 10), lalu saat scroll pengunjung "berjalan masuk" ke pintu piramida dan halaman berganti ke interior makam yang diterangi obor. Font: Dela Gothic One, Schibsted Grotesk, Red Hat Mono.

## 4. Mekanik (sama dengan engine yang berjalan)

1. **The rite**: tiap 10 detik engine cek escrow Pons. Kalau mencapai ukuran langkah berikutnya → claim.
2. **The tribute** (0.01 ETH) → ETH langsung ke 10 balok terbesar, dibagi sesuai porsi saldo.
3. **Builders' share** (0.02 ETH) → treasury.
4. **Into the afterlife** (0.01 ETH) → buyback $TOMB, yang dibeli saja yang dibakar.
5. Ulang dari 1. Porsi satu siklus: 25% / 50% / 25%, ditampilkan terbuka.

Syarat sealed: tidak pernah jual, saldo ≥ 100.000 $TOMB, hold time sesuai `minHoldHours`.

## 5. Yang masih menyebut nama lama (backend tidak disentuh atas permintaan owner)

- Teks yang ditandatangani wallet saat set throne name / link X: `"Robin Heist: claim my byline"`, `"Robin Heist: link my X account"` (`bot/byline.ts`).
- Pesan error engine: `"Only wallets holding $RBANK can …"` (`bot/byline.ts`, `bot/pads-engine.ts`).
- Daftar kata terlarang nickname masih berisi `robin`, `heist`, `rbank` (belum `tomb`, `pharaoh`).
- `SITE_URL` default `https://robinheist.fun` (`bot/xlink.ts`) dan `scripts/site-mode.sh` masih menunjuk domain/proses lama.
- `X_URL` di `src/lib/api.ts` masih `x.com/pepadsrh`.

Semua itu hanya teks, bukan logika. Ganti saat domain dan handle baru sudah pasti.
