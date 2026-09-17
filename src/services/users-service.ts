import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<void> {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, password: hashedPassword });
}