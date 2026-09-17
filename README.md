# Backend Project — Bun + ElysiaJS + Drizzle + MySQL

REST API backend yang dibangun menggunakan **Bun** sebagai runtime, **ElysiaJS** sebagai web framework, **Drizzle ORM** untuk query & migration database, dan **MySQL** sebagai database layer.

---

## Prasyarat

- [Bun](https://bun.sh/) (v1.0+)
- MySQL Server (lokal atau remote instance)

---

## Setup & Instalasi

1. **Clone repository & masuk ke direktori proyek:**
   ```bash
   cd test-vibe
   ```

2. **Install dependencies menggunakan Bun:**
   ```bash
   bun install
   ```

3. **Konfigurasi Environment Variables:**
   Salin template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

   Sesuaikan variabel di file `.env` dengan kredensial database MySQL Anda:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=test_db
   ```

---

## Menjalankan Database Migration

Pastikan database MySQL sudah dibuat (misal: `CREATE DATABASE test_db;`), kemudian jalankan perintah berikut:

- **Generate SQL Migration file dari schema Drizzle:**
  ```bash
  bun run db:generate
  ```

- **Push schema langsung ke database MySQL:**
  ```bash
  bun run db:push
  ```

- **Membuka Drizzle Studio (Database GUI):**
  ```bash
  bun run db:studio
  ```

---

## Menjalankan Server

- **Mode Development (dengan auto-reload):**
  ```bash
  bun run dev
  ```
  Server akan berjalan di `http://localhost:3000`.

---

## Struktur Folder

```
src/
├── index.ts          # Entry point aplikasi, inisialisasi Elysia & CORS
├── env.ts            # Validasi & export konfigurasi environment variables
├── db/
│   ├── index.ts      # Koneksi database pool (mysql2 + Drizzle)
│   └── schema.ts     # Definisi tabel Drizzle ORM (tabel users)
└── routes/
    ├── index.ts      # Router aggregator
    └── users.ts      # CRUD endpoints untuk resource users
drizzle.config.ts     # Konfigurasi Drizzle Kit untuk migration
drizzle/              # SQL migration files yang di-generate
.env                  # Variabel environment lokal (di-ignore oleh git)
.env.example          # Contoh variabel environment
```

---

## Daftar Endpoint API

| Method | Endpoint | Deskripsi | Request Body |
|---|---|---|---|
| `GET` | `/` | Health check & welcome message | - |
| `GET` | `/users` | Mengambil seluruh daftar user | - |
| `GET` | `/users/:id` | Mengambil detail satu user | - |
| `POST` | `/users` | Menambahkan user baru | `{ "name": "John Doe", "email": "john@example.com" }` |
| `PUT` | `/users/:id` | Memperbarui data user | `{ "name": "John Doe Updated", "email": "john.new@example.com" }` |
| `DELETE` | `/users/:id` | Menghapus user berdasarkan ID | - |
