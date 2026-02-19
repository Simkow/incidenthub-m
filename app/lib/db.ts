import { neon } from '@neondatabase/serverless';

export type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<unknown[]>;

let cachedSql: ReturnType<typeof neon> | null = null;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL env var is not set (create .env.local with DATABASE_URL=...)",
    );
  }

  if (!cachedSql) {
    cachedSql = neon(databaseUrl);
  }

  return cachedSql;
}

const sql: SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const tag = getSql() as unknown as SqlTag;
  return tag(strings, ...values);
};

export { sql };

