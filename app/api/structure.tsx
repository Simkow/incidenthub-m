import { pool } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. walidacja
    // 2. logika (SQL / bcrypt)
    // 3. return Response.json()

    return Response.json({ ok: true })
  } catch (err) {
    console.error(err)
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
