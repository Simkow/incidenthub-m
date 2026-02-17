import { sql } from "../../lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ message: "All fields are required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, email, name, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    return Response.json(
      {
        message: "Login successful",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
