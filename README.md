# Acip Ayam Gunting — Web App Pesanan

Web app untuk membuat pesanan **Ayam Gunting Acip** secara online. Pelanggan boleh pilih menu, buat pesanan, muat naik bukti pembayaran, dan admin boleh urus pesanan melalui dashboard.

## 🚀 Ciri-ciri

### Pelanggan
- Paparan menu dengan gambar & harga
- Tambah/kurang item ke troli (cart)
- Borang checkout (nama, telefon, catatan)
- Halaman pembayaran dengan QR code
- Muat naik bukti pembayaran (JPG/PNG/PDF)
- Notifikasi WhatsApp automatik ke admin

### Admin
- Login selamat (Supabase Auth)
- Dashboard pesanan dengan statistik
- Lihat butiran pesanan penuh
- Kemas kini status pembayaran (unpaid / pending_verification / verified / rejected)
- Kemas kini status pesanan (new / preparing / ready_for_pickup / completed / cancelled)
- Hubungi pelanggan terus melalui WhatsApp

## 🛠️ Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM v7 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Styling | CSS |

## 📦 Pemasangan

```bash
# Pasang dependencies
npm install

# Jalankan dev server
npm run dev

# Bina untuk production
npm run build

# Pratonton build production
npm run preview
```

## ⚙️ Konfigurasi

Cipta fail `.env` di root projek:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🗄️ Skema Database (Supabase)

### `products`
| Kolum | Jenis | Keterangan |
|---|---|---|
| id | int8 (PK) | ID produk |
| name | text | Nama produk |
| slug | text | Slug unik |
| price | numeric | Harga (RM) |
| image_url | text | URL gambar |
| is_active | bool | Papar di menu |

### `orders`
| Kolum | Jenis | Keterangan |
|---|---|---|
| id | int8 (PK) | ID pesanan |
| order_code | text | Kod pesanan (ACIP-YYYYMMDD-XXXXXX) |
| customer_name | text | Nama pelanggan |
| phone | text | No. telefon |
| remarks | text | Catatan |
| total | numeric | Jumlah (RM) |
| payment_status | text | unpaid / pending_verification / verified / rejected |
| order_status | text | new / preparing / ready_for_pickup / completed / cancelled |
| receipt_url | text | URL bukti pembayaran |
| created_at | timestamptz | Masa pesanan dibuat |

### `order_items`
| Kolum | Jenis | Keterangan |
|---|---|---|
| id | int8 (PK) | ID item |
| order_id | int8 (FK) | Rujuk `orders.id` |
| product_id | int8 (FK) | Rujuk `products.id` |
| product_name | text | Nama produk (snapshot) |
| price | numeric | Harga seunit (snapshot) |
| qty | int4 | Kuantiti |
| subtotal | numeric | price × qty |

## 🌐 Hosting

Projek di-host menggunakan **Cloudflare Pages** yang disambung ke repo GitHub ini.
Setiap `git push` ke branch `main` akan mencetuskan deploy automatik.

## 📁 Struktur Projek

```
src/
├── lib/
│   ├── auth.ts          # Fungsi Supabase Auth
│   └── supabase.ts      # Client Supabase + shared types
├── pages/
│   ├── AdminDashboard.tsx    # Senarai pesanan
│   ├── AdminLogin.tsx        # Login admin
│   └── AdminOrderDetail.tsx  # Butiran pesanan
├── App.tsx              # Customer app + routing
├── App.css              # Styling customer
├── Admin.css            # Styling admin
└── index.css            # Global reset
```
