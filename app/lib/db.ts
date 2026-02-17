import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL env var is not set');
}

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_D0arJmP6cHUw@ep-delicate-tooth-agfl0bpg-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

export { sql };