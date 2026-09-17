# Issue: API Login User & Sessions Table

## Deskripsi

Implementasikan fitur autentikasi login user dan tabel sessions untuk melacak sesi user yang login. Password harus dicek valid di database (bandingkan dengan hash bcrypt yang tersimpan). Jika login berhasil, kembalikan token UUID. Email/Password salah → kembalikan pesan error.

---

## Kondisi Project Saat Ini

Project ini sudah memiliki setup dasar dan fitur registrasi user baru (`POST /api/users`) yang sudah diimplementasikan.

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **ORM**: Drizzle ORM + MySQL
- **Database**: MySQL (`test_db`) sudah berjalan di localhost
- **Sudah ada**: Tabel `users` dengan kolom `password` (hash bcrypt), endpoint `POST /api/users` registrasi

File-file penting yang sudah ada:
- `src/index.ts` — Entry point server Elysia
- `src/db/schema.ts` — Definisi tabel Drizzle (sudah ada tabel `users`)
- `src/db/index.ts` — Koneksi database Drizzle + mysql2
- `src/routes/index.ts` — Aggregator route (sudah terdaftar route registrasi)
- `src/routes/users-route.ts` — Route registrasi user di prefix `/api/users`
- `src/services/users-service.ts` — Logic bisnis registrasi user

---

## Spesifikasi Tabel `sessions`

Buat tabel `sessions` di file `src/db/schema.ts` dengan kolom berikut:

| Kolom        | Tipe                | Constraint                        |
|--------------|---------------------|-----------------------------------|
| `id`         | integer             | primary key, auto increment       |
| `token`      | varchar(255)        | not null, unique (isi: UUID)      |
| `user_id`    | integer             | not null, foreign key → users.id  |
| `created_at` | timestamp           | default current_timestamp         |

**Catatan:** Kolom `token` berisi string UUID yang unik per sesi login.

---

## Spesifikasi API Login

### Endpoint

```
POST /api/users/login
```

### Request Body

```json
{
  "email": "eko@localhost",
  "password": "rahasia"
}
```

### Response Body (Success) — HTTP 200

```json
{
  "data": "uuid-token-here"
}
```

### Response Body (Error: Email atau Password Salah) — HTTP 400

```json
{
  "error": "Email atau password salah"
}
```

---

## Struktur Folder & Konvensi Penamaan File

Semua kode baru ditambahkan di dalam folder `src/`. Terapkan pola berikut:

```
src/
├ index.ts              # Entry point (sudah ada)
├ db/
│   ├── index.ts        # Koneksi database (sudah ada, tidak perlu diubah)
│   └── schema.ts       # Perlu diupdate: tambah tabel sessions
├ routes/
│   ├── index.ts        # Aggregator route (perlu diupdate: daftarkan route login)
│   └── users-route.ts  # Sudah ada: route registrasi + login
└ services/
    └── users-service.ts# Sudah ada: logic registrasi + login
```

### Konvensi:
- **Routes** (`src/routes/`): Penamaan file menggunakan format `{resource}-route.ts`. Contoh: `users-route.ts`
- **Services** (`src/services/`): Penamaan file menggunakan format `{resource}-service.ts`. Contoh: `users-service.ts`

---

## Tahapan Implementasi (Step-by-Step)

Ikuti tahapan ini secara berurutan. **Jangan lompati langkah.**

### Tahap 1: Buat Tabel `sessions` di Schema Database

Buka file `src/db/schema.ts`. Tambahkan definisi tabel `sessions` setelah definisi tabel `users`.

**Yang perlu dilakukan:**
1. Import `serial`, `varchar`, `timestamp`, `pgTable`, `foreignKey`, `ref` dari `drizzle-orm/mysql-core` (sesuai driver MySQL digunakan).
2. Buat tabel `sessions` dengan kolom: `id`, `token`, `user_id`, `created_at`.
3. Buat hubungan foreign key `user_id` merujuk ke `users.id`.
4. Pastikan `token` memiliki constraint `unique`.
5. Pastikan `User` dan `NewUser` di bagian bawah file tetap ter-export.

**Contoh hasil akhir tabel `sessions`:**
```typescript
export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  user_id: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionRelations = relations(users, ({one, many}) => ({
  sessions: many(sessions),
}));

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
```

### Tahap 2: Push Perubahan Schema ke Database

Setelah schema diupdate, sinkronkan perubahan ke database MySQL:
```bash
bun run db:push
```

Perintah ini akan menambahkan tabel `sessions` ke database.

### Tahap 3: Buat Logic Login di Service (`src/services/users-service.ts`)

Perbaharui file `src/services/users-service.ts` menambah fungsi `loginUser(email: string, password: string): Promise<string | null>`.

**Fungsi yang harus dibuat:**

#### `loginUser(email: string, password: string): Promise<string | null>`

Alur logic di dalam fungsi ini:
1. **Cari user berdasarkan email** — Query database: `SELECT` dari tabel `users` `WHERE email = <email input>`. Gunakan `eq()` dari `drizzle-orm`.
2. **Jika user tidak ditemukan** — Return `null`.
3. **Bandingkan password** — Gunakan `bcryptjs` untuk membandingkan password plaintext yang dimasukkan dengan hash yang tersimpan di database:
   ```typescript
   import bcrypt from "bcryptjs";
   const passwordMatch = await bcrypt.compare(password, user.password);
   ```
4. **Jika password salah** — Return `null`.
5. **Jika login berhasil** — Buat token UUID baru, simpan ke tabel `sessions` dengan `user_id` terkait, lalu return token string.
   - Gunakan library `crypto` bawaan Node.js untuk generate UUID:
     ```typescript
     import { v4 as uuidv4 } from "uuid";
     const token = uuidv4();
     await db.insert(sessions).values({ token, userId: user.id });
     return token;
     ```

**Import yang dibutuhkan:**
```typescript
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { v4 as uuidv4 } from "uuid";
```

### Tahap 4: Buat Endpoint Login di Route (`src/routes/users-route.ts`)

Perbaharui file `src/routes/users-route.ts` menambah endpoint `POST /login`.

**Yang harus dilakukan:**
1. Impor `loginUser` dari service.
2. Definisikan endpoint `POST /login` (di dalam instance Elysia prefix `/api/users`):
   - **Validasi body** menggunakan `t.Object()`:
     - `email`: `t.String({ format: "email" })`
     - `password`: `t.String({ minLength: 1 })`
   - **Di dalam handler:**
     - Panggil `await registerUser(body.email, body.password)` di dalam blok `try-catch`.
     - Jika **berhasil** (token diterima): set status `200` dan return `{ data: token }`.
     - Jika **error** (email/password salah): set status `400` dan return `{ error: "Email atau password salah" }`.

### Tahap 5: Daftarkan Fungsi Login di Aggregator (`src/routes/index.ts`)

Buka file `src/routes/index.ts`. Pastikan route login sudah terdaftar.

**Yang perlu dilakukan:**
- Pastikan import dan `.use(usersRoute)` sudah ada (langkah sebelumnya dari issue registrasi). Route login sudah termasuk di dalam `users-route.ts`.

### Tahap 6: Testing Manual

Jalankan server:
```bash
bun run dev
```

#### Test 1: Login Berhasil
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "eko@localhost", "password": "rahasia"}'
```

**Expected response** (HTTP 200):
```json
{ "data": "uuid-token-string" }
```

#### Test 2: Email/Salah Password
Jalankan perintah curl yang sama persis lagi.

**Expected response** (HTTP 400):
```json
{ "error": "Email atau password salah" }
```

#### Test 3: Verifikasi di Database
Pastikan data baru muncul di tabel `sessions`:
```bash
mysql -u root -p -e "SELECT * FROM test_db.sessions LIMIT 5;"
```
Kolom `token` harus menampilkan string UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

#### Test 4: Verifikasi Token Unik
Jalankan login kedua dengan email yang sama, pastikan token berbeda-beda tiap kali.

---

## Catatan Penting

- **Jangan** simpan password dalam bentuk plaintext. Selalu bandingkan dengan bcrypt `compare`.
- **Jangan** ubah file-file yang tidak disebutkan di issue ini (kecuali jika benar-benar diperlukan).
- Gunakan **Bun** untuk semua operasi (jangan pakai npm/yarn/pnpm).
- Pastikan file `.env` tidak ter-commit ke git (sudah di-`.gitignore`).
- Kolom `token` di tabel `sessions` harus `UNIQUE` — hindari duplikasi token login.