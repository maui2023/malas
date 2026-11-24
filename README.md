# 🦥 malas (OpenWork Lite)

> **"Simple openwork untuk yang malas urus email"**  
> 100% Client-Side, Local-First AI Executive Assistant untuk Google Workspace & Gmail.  
> Berjalan terus di dalam pelayar web anda tanpa sebarang backend server atau pengkalan data luar.

🌐 **Aplikasi Live:** [https://maui2023.github.io/malas](https://maui2023.github.io/malas)

---

## ⚡ Ciri-Ciri Utama (Key Features)

* **100% Serverless & Zero-Backend:** Dihoskan secara statik di GitHub Pages (`HTML + JS + CSS`). Tiada pelayan perantara yang membaca, menyimpan, atau memproses data emel anda.
* **Privasi Tempatan (Local-First Persistence):**
  * Konfigurasi & API Key (BYOK) disimpan terus di `localStorage` peranti anda.
  * Ringkasan emel, draf, dan log perbualan disimpan secara selamat di `IndexedDB` browser (menggunakan Dexie.js).
  * Token capaian OAuth disimpan di ingatan (`sessionStorage`) dengan pengesanan tempoh luput automatik.
  * **Panic Button ("Clear All Local Data"):** Satu klik untuk memadamkan semua data tempatan serta-merta.
* **Direct Client-Side OAuth (Google Identity Services - GIS):**
  * Menggunakan Implicit / Token Client rasmi Google tanpa memerlukan `client_secret` (selamat untuk aplikasi statik awam).
  * Bantuan pintar Authorized Origins automatik dengan butang salin satu-klik.
  * Kawalan kebenaran (*granular scopes*) – anda pilih apa yang AI dibenarkan buat (Baca emel, sediakan draf, susun label, atau hantar emel).
* **AI Tool-Calling Engine (BYOK - Bring Your Own Key):**
  * Menyokong **Google Gemini API** (disyorkan: `gemini-2.5-flash` percuma dari Google AI Studio) serta **OpenAI-compatible endpoints** (OpenRouter / GPT-4o-mini).
  * Menggunakan *Function Calling* tempatan untuk:
    1. `list_emails(query, maxResults)` — cari emel unread, bertapis mengikut tarikh atau penghantar.
    2. `get_email_thread(threadId)` — baca perbualan emel penuh dengan selamat.
    3. `summarize_inbox(filter, count)` — analisa dan kumpulkan intipati emel mengikut prioriti.
    4. `create_draft(to, subject, body, threadId)` — bina draf sebenar di dalam akaun Gmail anda.
    5. `propose_send_email(...)` — kad pengesahan interaktif ("Approve & Send") supaya AI tidak menghantar sebarang emel tanpa kebenaran anda.
    6. `manage_labels(...)` — arkibkan emel promosi atau tandakan sebagai dibaca.
* **Headless Automation Ready:**
  * Boleh dijalankan secara automatik menggunakan Playwright/Puppeteer melalui parameter URL `?headless=true&task=daily_digest`.
  * Menghasilkan output JSON bersih pada elemen `#headless-output` dan menyokong Webhook (Discord / Telegram / Slack).

---

## 🚀 Panduan Setup Pantas (Langkah Demi Langkah)

Hanya perlu setup sekali sahaja untuk mula menggunakan **malas**:

### Langkah 1: Dapatkan Google OAuth 2.0 Client ID (Percuma)

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Cipta projek baru (contoh nama: `malas-email-agent`).
3. Pergi ke **APIs & Services** &rarr; **Library**, cari **Gmail API** dan klik **Enable**.
4. Pergi ke **APIs & Services** &rarr; **OAuth consent screen**:
   * Pilih **External** &rarr; klik **Create**.
   * Masukkan *App name* (contoh: `malas`), *User support email*, dan *Developer contact email*.
   * Pada bahagian *Test users*, masukkan alamat emel Gmail anda sendiri.
5. Pergi ke **APIs & Services** &rarr; **Credentials**:
   * Klik **+ CREATE CREDENTIALS** &rarr; pilih **OAuth client ID**.
   * Application type: pilih **Web application**.
   * Name: `malas Web Client`.
   * Pada bahagian **Authorized JavaScript origins**, tambah URL berikut:
     * `https://maui2023.github.io`
     * `http://localhost:5173` *(jika ingin menjalankan di komputer secara lokal)*
   * Klik **Create**.
6. Salin **Client ID** anda (format: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).  
   *(Nota: `Client Secret` tidak diperlukan kerana aplikasi ini berjalan 100% di browser anda).*

---

### Langkah 2: Dapatkan Gemini API Key (Percuma)

1. Layari [Google AI Studio (aistudio.google.com/app/apikey)](https://aistudio.google.com/app/apikey).
2. Klik **Create API key** dan salin kunci API anda.

---

### Langkah 3: Sambungkan ke malas

1. Buka aplikasi di [https://maui2023.github.io/malas](https://maui2023.github.io/malas).
2. Klik butang **Connect Google** pada bahagian atas:
   * Masukkan **OAuth Client ID** yang anda salin tadi.
   * Pilih kebenaran yang dikehendaki (*Read Gmail*, *Create drafts*, dll).
   * Klik **Save & Connect with Google** dan log masuk dengan akaun Google anda.
3. Klik ikon **Settings** (⚙️):
   * Masukkan **Gemini API Key** anda.
   * Model lalai: `gemini-2.5-flash` (sangat pantas dan percuma).
   * Klik **Save Configuration**.

Selesai! Anda kini sedia untuk mengurus emel tanpa bersusah-payah.

---

## 💡 Contoh Penggunaan Harian (Workflows)

Anda boleh menaip arahan dalam Bahasa Melayu atau Bahasa Inggeris, atau tekan cip pintas di atas ruang mesej:

### 1. Ringkaskan Emel Hari Ini & Senarai Tindakan
> *"Tolong baca semua emel unread harini. Kelaskan ikut prioriti (🔥 Urgent, 📌 Needs Reply, ℹ️ FYI) dan bagi checklist apa yang saya kena buat."*

AI akan menyenaraikan emel penting, siapa yang menghantar, dan intipati yang memerlukan respon anda.

### 2. Sediakan Draf Jawapan Automatik
> *"Semak emel penting dari 24 jam lepas yang belum dibalas, dan sediakan draf jawapan yang sopan untuk setiap satu."*

AI akan membina draf di dalam akaun Gmail anda dan memaparkan **Interactive Action Card** di dalam perbualan:
* Anda boleh klik **Edit** untuk ubah teks.
* Anda boleh semak draf terus di aplikasi Gmail anda.
* Anda boleh klik **Approve & Send** untuk hantar terus sekiranya berpuas hati.

### 3. Cari Invois & Resit Bulanan
> *"Cari semua emel invois, resit atau bukti pembayaran bulan ini dan kirakan jumlah kasar yang dibelanjakan."*

### 4. Bersihkan Emel Promosi / Surat Berita
> *"Cari emel newsletter dan promosi yang belum dibaca dan cadangkan untuk diarkibkan supaya inbox bersih."*

---

## 🤖 Automasi Headless (CLI / Cron Runner)

Ingin ringkasan emel dihantar secara automatik setiap pagi tanpa perlu membuka pelayar web?

Aplikasi ini menyokong mod **Headless Execution** menggunakan Playwright dengan profil pengguna yang kekal (`--user-data-dir`).

### Cara Menjalankan Headless Runner:

1. Pasang dependensi runner:
   ```bash
   npm install
   ```

2. **Langkah Sekali Sahaja (Persediaan Sesi):**  
   Buka pelayar secara interaktif untuk menyimpan sesi OAuth dan API key:
   ```bash
   node scripts/headless-runner.js --interactive
   ```
   *Log masuk ke akaun Google anda sekali, kemudian tutup tetingkap pelayar.*

3. **Jalankan Secara Automatik (Headless):**
   ```bash
   node scripts/headless-runner.js --task=daily_digest
   ```

4. **Jadualkan di Crontab (Contoh: setiap hari jam 8:00 pagi):**
   ```bash
   0 8 * * * cd /path/to/malas && node scripts/headless-runner.js --task=daily_digest >> /tmp/malas-cron.log 2>&1
   ```

### Webhook Notifikasi (Discord / Telegram / Slack):
Di dalam menu **Settings** pada aplikasi web, anda boleh memasukkan **Headless Webhook URL**. Apabila skrip headless tamat, hasil ringkasan emel akan dihantar terus ke Webhook anda.

---

## 📦 Eksport & Import Konfigurasi

* Pergi ke butang **Export / Import Config** (ikon fail) pada menu atas.
* Klik **Download .json** untuk menyimpan salinan tetapan anda.
* Boleh diimport semula ke pelayar lain atau komputer lain dengan mudah tanpa perlu memasukkan semula tetapan satu demi satu.
* Sekiranya anda menggunakan komputer awam, tekan **Wipe All Local Data (Panic Button)** untuk memadamkan semua pangkalan data IndexedDB, token sesi, dan API key serta-merta.

---

## 💻 Pembangunan Tempatan (Local Development)

Sekiranya anda ingin mengubah kod sumber atau menjalankan secara lokal:

```bash
# 1. Clone repository
git clone https://github.com/maui2023/malas.git
cd malas

# 2. Pasang pakej
npm install

# 3. Jalankan pelayan pembangunan Vite
npm run dev

# 4. Bina untuk pengeluaran (production build)
npm run build
```

Buka pelayar di `http://localhost:5173`. Pastikan `http://localhost:5173` telah ditambah pada *Authorized JavaScript Origins* di Google Cloud Console.

---

## 🛡️ Keselamatan & Privasi

* **Tiada Pengkalan Data Luar:** Semua data emel yang diambil hanya berada di dalam memori pelayar dan `IndexedDB` tempatan komputer anda.
* **Tiada Proksi Pelayan:** Permintaan HTTP dibuat terus dari pelayar web anda ke endpoint rasmi `https://gmail.googleapis.com` dan `https://generativelanguage.googleapis.com`.
* **Kawalan Hantar Emel:** AI tidak mempunyai kuasa untuk menghantar emel secara automatik tanpa kad pengesahan interaktif, melainkan anda membenarkannya secara eksplisit di mod headless.

---

## 📄 Lesen

MIT License © 2026 malas contributors. Dihoskan di [maui2023.github.io/malas](https://maui2023.github.io/malas).
