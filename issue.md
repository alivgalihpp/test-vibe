# Issue: API Registrasi User Baru

## Deskripsi

Implementasikan fitur registrasi user baru dengan endpoint `POST /api/users`. Password harus di-hash menggunakan **bcrypt** sebelum disimpan ke database. Email harus unik — jika sudah terdaftar, kembalikan pesan error.

---

## Kondisi Project Saat Ini

Project ini sudah memiliki setup dasar:
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **ORM**: Drizzle ORM + MySQL
- **Database**: MySQL (`test_db`) sudah berjalan di localhost

File-file penting yang sudah ada:
- `src/index.ts` — Entry point server Elysia
- `src/db/schema.ts` — Definisi tabel Drizzle (saat ini ada tabel `users` tapi **belum ada kolom `password`**)
- `src/db/index.ts` — Koneksi database Drizzle + mysql2
- `src/routes/index.ts` — Aggregator route
- `src/routes/users.ts` — Route CRUD users yang sudah ada (GET, POST, PUT, DELETE di prefix `/users`)
- `package.json` — Sudah ada dependencies elysia, drizzle-orm, mysql2, dll.

---

## Spesifikasi Tabel `users`

Update tabel `users` di file `src/db/schema.ts` agar memiliki kolom berikut:

| Kolom        | Tipe                | Constraint                        |
|--------------|---------------------|-----------------------------------|
| `id`         | integer             | primary key, auto increment       |
| `name`       | varchar(255)        | not null                          |
| `email`      | varchar(255)        | not null, unique                  |
| `password`   | varchar(255)        | not null                          |
| `created_at` | timestamp           | default current_timestamp         |

> **Catatan:** Kolom `password` berisi hasil hash bcrypt, bukan plaintext.

---

## Spesifikasi API

### Endpoint

```
POST /api/users
```

### Request Body

```json
{
  "name": "Eko",
  "email": "eko@localhost",
  "password": "rahasia"
}
```

### Response Body (Success) — HTTP 201

```json
{
  "data": "OK"
}
```

### Response Body (Error: Email Sudah Terdaftar) — HTTP 400

```json
{
  "error": "Email sudah terdaftar"
}
```

### Response Body (Error: Validasi Gagal) — HTTP 400

```json
{
  "error": "Pesan error validasi"
}
```

---

## Struktur Folder & Konvensi Penamaan File

Semua kode baru ditulis di dalam folder `src/`. Terapkan pola berikut:

```
src/
├── index.ts              # Entry point (sudah ada, perlu diupdate)
├── db/
│   ├── index.ts          # Koneksi database (sudah ada, tidak perlu diubah)
│   └── schema.ts         # Definisi tabel Drizzle (perlu diupdate: tambah kolom password)
├── routes/
│   ├── index.ts          # Aggregator route (perlu diupdate: daftarkan route baru)
│   └── users-route.ts    # [BARU] Route registrasi user di prefix /api/users
└── services/
    └── users-service.ts  # [BARU] Logic bisnis: cek email, hash password, insert ke DB
```

### Konvensi:
- **Routes** (`src/routes/`): Penamaan file menggunakan format `{resource}-route.ts`. Contoh: `users-route.ts`
- **Services** (`src/services/`): Penamaan file menggunakan format `{resource}-service.ts`. Contoh: `users-service.ts`

---

## Tahapan Implementasi (Step-by-Step)

Ikuti tahapan ini secara berurutan. **Jangan lompati langkah.**

### Tahap 1: Install Dependency `bcryptjs`

Kita membutuhkan library bcrypt untuk meng-hash password. Gunakan `bcryptjs` (versi pure JavaScript yang kompatibel dengan Bun).

Jalankan perintah berikut di terminal:
```bash
bun add bcryptjs
bun add -d @types/bcryptjs
```

### Tahap 2: Update Schema Database (`src/db/schema.ts`)

Buka file `src/db/schema.ts`. Saat ini tabel `users` belum memiliki kolom `password`. Tambahkan kolom `password` ke definisi tabel.

**Yang perlu dilakukan:**
1. Tambahkan kolom `password` bertipe `varchar(255)` dan `notNull()` ke dalam definisi `mysqlTable("users", { ... })`.
2. Posisikan kolom `password` setelah kolom `email`.
3. Pastikan tipe `User` dan `NewUser` di bagian bawah file tetap ter-export.

**Contoh hasil akhir kolom `password`:**
```typescript
password: varchar("password", { length: 255 }).notNull(),
```

### Tahap 3: Push Perubahan Schema ke Database

Setelah schema diupdate, sinkronkan perubahan ke database MySQL:
```bash
bun run db:push
```

Perintah ini akan menambahkan kolom `password` ke tabel `users` yang sudah ada di database.

### Tahap 4: Buat File Service (`src/services/users-service.ts`)

Buat file baru `src/services/users-service.ts`. File ini berisi **logic bisnis** untuk registrasi user.

**Fungsi yang harus dibuat:**

#### `registerUser(name: string, email: string, password: string): Promise<void>`

Alur logic di dalam fungsi ini:
1. **Cek apakah email sudah terdaftar** — Query database: `SELECT` dari tabel `users` `WHERE email = <email input>`. Gunakan `eq()` dari `drizzle-orm`.
2. **Jika email sudah ada** — Throw error dengan pesan `"Email sudah terdaftar"`.
3. **Hash password** — Gunakan `bcryptjs`:
   ```typescript
   import bcrypt from "bcryptjs";
   const hashedPassword = await bcrypt.hash(password, 10);
   ```
   Angka `10` adalah jumlah salt rounds.
4. **Insert user baru ke database** — Gunakan `db.insert(users).values({ name, email, password: hashedPassword })`.

**Import yang dibutuhkan:**
```typescript
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
```

### Tahap 5: Buat File Route (`src/routes/users-route.ts`)

Buat file baru `src/routes/users-route.ts`. File ini berisi definisi endpoint ElysiaJS.

**Yang harus dilakukan:**
1. Buat instance Elysia dengan prefix `/api/users`:
   ```typescript
   import { Elysia, t } from "elysia";
   import { registerUser } from "../services/users-service";
   ```
2. Definisikan endpoint `POST /` (yang menjadi `POST /api/users` karena prefix):
   - **Validasi body** menggunakan `t.Object()`:
     - `name`: `t.String({ minLength: 1 })`
     - `email`: `t.String({ format: "email" })`
     - `password`: `t.String({ minLength: 1 })`
   - **Di dalam handler:**
     - Panggil `await registerUser(body.name, body.email, body.password)` di dalam blok `try-catch`.
     - Jika **berhasil**: set status `201` dan return `{ data: "OK" }`.
     - Jika **error**: set status `400` dan return `{ error: error.message }` (ini akan mengembalikan pesan "Email sudah terdaftar" jika email duplikat).

### Tahap 6: Daftarkan Route Baru di Aggregator (`src/routes/index.ts`)

Buka file `src/routes/index.ts`. Saat ini isinya:
```typescript
import { Elysia } from "elysia";
import { userRoutes } from "./users";

export const routes = new Elysia().use(userRoutes);
export { userRoutes };
```

**Yang perlu dilakukan:**
1. Import route baru:
   ```typescript
   import { usersRoute } from "./users-route";
   ```
2. Tambahkan `.use(usersRoute)` ke instance Elysia:
   ```typescript
   export const routes = new Elysia().use(userRoutes).use(usersRoute);
   ```

### Tahap 7: Testing Manual

Jalankan server:
```bash
bun run dev
```

#### Test 1: Registrasi Berhasil
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Eko", "email": "eko@localhost", "password": "rahasia"}'
```
**Expected response** (HTTP 201):
```json
{ "data": "OK" }
```

#### Test 2: Email Sudah Terdaftar
Jalankan perintah curl yang sama persis seperti Test 1 sekali lagi.

**Expected response** (HTTP 400):
```json
{ "error": "Email sudah terdaftar" }
```

#### Test 3: Validasi — Body Kosong
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected response** (HTTP 400): Error validasi dari Elysia.

#### Test 4: Verifikasi di Database
Pastikan password tersimpan sebagai hash bcrypt (bukan plaintext):
```bash
mysql -u root -p -e "SELECT id, name, email, LEFT(password, 30) AS password_preview FROM test_db.users;"
```
Kolom `password_preview` harus menampilkan string yang diawali `$2a$10$...` (format hash bcrypt).

---

## Catatan Penting

- **JANGAN** simpan password dalam bentuk plaintext. Selalu hash dengan bcrypt sebelum insert ke database.
- **JANGAN** ubah file-file yang tidak disebutkan di issue ini (kecuali jika benar-benar diperlukan).
- **JANGAN** menghapus route CRUD yang sudah ada di `src/routes/users.ts`.
- Gunakan **Bun** untuk semua operasi (jangan pakai npm/yarn/pnpm).
- Pastikan file `.env` tidak ter-commit ke git (sudah di-`.gitignore`).
