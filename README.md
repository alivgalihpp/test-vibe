# Backend Project (Bun + ElysiaJS + Drizzle ORM + MySQL)

Project backend REST API yang dibangun menggunakan Bun, ElysiaJS, Drizzle ORM, dan MySQL.

## Prerequisites

- [Bun](https://bun.sh) (v1.0.0+)
- MySQL Server (berjalan lokal atau remote)

## Setup & Instalasi

1. **Clone repository dan masuk ke directory project:**
   ```bash
   git clone https://github.com/alivgalihpp/test-vibe.git
   cd test-vibe
   ```

2. **Install dependencies menggunakan Bun:**
   ```bash
   bun install
   ```

3. **Konfigurasi Environment Variables:**
   Salin atau buat file `.env` di root directory dengan variabel berikut:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=test_vibe
   PORT=3000
   ```
   *Pastikan database MySQL dengan nama `test_vibe` sudah dibuat di MySQL server Anda.*

## Database Migration

1. **Generate Migration Files:**
   ```bash
   bun run db:generate
   ```

2. **Push Schema ke Database:**
   ```bash
   bun run db:push
   ```

3. **Buka Drizzle Studio (Database GUI Viewer):**
   ```bash
   bun run db:studio
   ```

## Running Development Server

Jalankan server dalam mode development dengan auto-reload:

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3000`.

## API Endpoints

### General
- `GET /` — Welcome message & API status check

### Users Resource (`/users`)
- `GET /users` — Mendapatkan semua data user
- `GET /users/:id` — Mendapatkan detail user berdasarkan ID
- `POST /users` — Menambahkan user baru
  - Body (JSON): `{ "name": "John Doe", "email": "john@example.com" }`
- `PUT /users/:id` — Memperbarui data user
  - Body (JSON): `{ "name": "Jane Doe", "email": "jane@example.com" }` (opsional)
- `DELETE /users/:id` — Menghapus user berdasarkan ID
