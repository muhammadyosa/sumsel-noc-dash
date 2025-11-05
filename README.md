# NOC RITEL Dashboard

Dashboard monitoring incident NOC RITEL dengan sinkronisasi GitHub otomatis.

## 🚀 Deploy ke GitHub Pages

### 1. Setup Repository

1. Push project ini ke GitHub repository
2. Buka **Settings** → **Pages**
3. Di **Source**, pilih **GitHub Actions**
4. Workflow akan otomatis deploy setiap push ke `main` branch

### 2. Konfigurasi

Edit `vite.config.ts` dan ubah `base` sesuai nama repository:

```ts
base: mode === 'production' ? '/nama-repo-anda/' : '/',
```

### 3. GitHub Personal Access Token

Untuk bisa menyimpan data ke GitHub:

1. Buka [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Pilih scope: `repo` (Full control of private repositories)
4. Copy token yang di-generate
5. Di aplikasi, klik tombol **Key** di pojok kiri bawah
6. Paste token dan simpan

## 🔄 Cara Kerja

- **Data disimpan di folder `data/`** dalam format JSON
- **Auto-sync setiap 5 detik** - data otomatis diperbarui tanpa reload
- **Offline mode** - jika koneksi terputus, data tersimpan di localStorage dan sync otomatis saat online kembali
- **Multi-user** - semua user melihat data yang sama (real-time collaboration)

## 📁 Struktur Data

```
data/
├── tickets.json      # Data tiket
├── excel-data.json   # Data import Excel
└── olt-data.json     # Data OLT
```

## 🌐 URL Aplikasi

Setelah deploy, aplikasi akan tersedia di:
```
https://username.github.io/nama-repo/
```

## 💡 Fitur

- ✅ Deploy otomatis dengan GitHub Actions
- ✅ Sinkronisasi data real-time (5 detik)
- ✅ Offline support dengan localStorage fallback
- ✅ Status koneksi dan last update timestamp
- ✅ Tidak perlu hosting berbayar
- ✅ Multi-user collaboration

## 🔧 Development

```bash
npm install
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🔐 Security Note

**Jangan commit GitHub token ke repository!** Token disimpan di localStorage browser, bukan di kode.

---

## Project info

**Lovable URL**: https://lovable.dev/projects/0c98ee9b-235c-4e7f-9842-25da3f12b562

## Technologies

- Vite + React + TypeScript
- shadcn-ui + Tailwind CSS
- GitHub API for data persistence
