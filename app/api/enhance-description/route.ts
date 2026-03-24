import OpenAI from "openai";
const client = new OpenAI();

export const dynamic = "force-dynamic";

type EnhanceDescriptionBody = {
  description?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | EnhanceDescriptionBody
      | null;

    const currentDescription =
      typeof body?.description === "string" ? body.description.trim() : "";

    if (!currentDescription) {
      return Response.json(
        { message: "description is required" },
        { status: 400 },
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You improve task descriptions. Keep original intent, add practical details, and return plain text only.",
        },
        {
          role: "user",
          content:
            `Enhance this task description and keep it concise but more actionable.\n` +
            `Current description: ${currentDescription}`,
        },
      ],
    });

    const enhancedDescription =
      response.choices[0]?.message?.content?.trim() ?? "";

    if (!enhancedDescription) {
      return Response.json(
        { message: "Model did not return description" },
        { status: 502 },
      );
    }

    return Response.json({ enhancedDescription }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}