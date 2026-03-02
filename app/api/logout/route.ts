export const dynamic = "force-dynamic";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    "auth_token=",
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const response = Response.json({ message: "Logged out" }, { status: 200 });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
