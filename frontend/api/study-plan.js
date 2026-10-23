const MODEL = "openai/gpt-oss-20b";

function validPayload(body) {
  return (
    body &&
    typeof body.examDate === "string" &&
    typeof body.availableHours === "number" &&
    body.availableHours > 0 &&
    Array.isArray(body.weakAreas) &&
    Array.isArray(body.topicScores)
  );
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GROQ_API_KEY) {
    return response.status(503).json({ error: "AI service is not configured" });
  }

  if (!validPayload(request.body)) {
    return response.status(400).json({ error: "Invalid study-plan payload" });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are the study-planning assistant for AZ-900 Compass, an unofficial AZ-900 preparation tool.
Use only the supplied exam date, available hours, weak areas and topic scores.
Never recalculate or alter scores.
Prioritise weak areas.
Do not exceed the supplied availableHours in total planned duration.
Do not schedule sessions after the supplied examDate.
Do not promise an official exam pass.
Return valid JSON only with exactly these keys:
summary: string,
sessions: [{date: string, durationMinutes: number, topic: string, activities: string[]}],
finalReview: string[].
Keep the plan practical and beginner-friendly.`,
          },
          {
            role: "user",
            content: JSON.stringify(request.body),
          },
        ],
      }),
    });

    if (!groqResponse.ok) {
      return response.status(502).json({ error: "AI provider unavailable" });
    }

    const groqData = await groqResponse.json();
    const parsed = JSON.parse(groqData?.choices?.[0]?.message?.content);

    if (
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.sessions) ||
      !Array.isArray(parsed.finalReview)
    ) {
      throw new Error("Invalid AI response shape");
    }

    const totalMinutes = parsed.sessions.reduce(
      (sum, session) => sum + Number(session.durationMinutes || 0),
      0
    );

    const invalidSession = parsed.sessions.some(
      (session) =>
        typeof session.date !== "string" ||
        session.date > request.body.examDate ||
        !Number.isInteger(session.durationMinutes) ||
        session.durationMinutes <= 0 ||
        typeof session.topic !== "string" ||
        !Array.isArray(session.activities)
    );

    if (invalidSession || totalMinutes > request.body.availableHours * 60) {
      throw new Error("Unsafe AI plan");
    }

    return response.status(200).json(parsed);
  } catch {
    return response.status(502).json({ error: "AI response unavailable" });
  } finally {
    clearTimeout(timer);
  }
}
