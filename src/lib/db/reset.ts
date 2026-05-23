import { db } from "./pglite";

export async function resetDatabase(): Promise<void> {
  await db.exec(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
  `);
}
