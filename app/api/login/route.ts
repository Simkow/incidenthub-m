import { sql } from "../../lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

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

    const user = rows[0] as {
      id: number;
      email: string;
      name: string;
      password_hash: string;
    };

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return Response.json(
        { message: "JWT_SECRET is not configured" },
        { status: 500 },
      );
    }

    const token = await new SignJWT({ name: user.name, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(secret));

    const isProd = process.env.NODE_ENV === "production";
    const cookie = [
      `auth_token=${token}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=604800",
      isProd ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    const response = Response.json(
      {
        message: "Login successful",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200 },
    );

    response.headers.set("Set-Cookie", cookie);
    return response;
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
