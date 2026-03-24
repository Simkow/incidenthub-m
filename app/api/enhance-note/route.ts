import { sql } from "../../lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      note?: unknown;
    } | null;

    const note = body?.note;

    if (typeof note !== "string" || !note.trim()) {
      return Response.json(
        { message: "Note is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You enhance incident notes. Keep original intent, add practical details, and return plain text only.",
        },
        {
          role: "user",
          content:
            `Enhance this incident note and keep it concise but more actionable.\n` +
            `Current note: ${note.trim()}`,
        },
      ],
    });

    const enhancedNote = response.choices[0]?.message?.content?.trim() ?? "";

    if (!enhancedNote) {
      return Response.json(
        { message: "Model did not return an enhanced note" },
        { status: 502 },
      );
    }

    return Response.json({ enhancedNote }, { status: 200 });
  } catch (error) {
    console.error("Error enhancing note:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}