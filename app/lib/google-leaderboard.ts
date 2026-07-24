type ScriptResponse = {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
};

function getConfiguration() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const apiKey = process.env.LEADERBOARD_API_KEY;

  if (!url || !apiKey) {
    throw new Error("LEADERBOARD_NOT_CONFIGURED");
  }

  if (!url.startsWith("https://script.google.com/") || !url.endsWith("/exec")) {
    throw new Error("INVALID_GOOGLE_APPS_SCRIPT_URL");
  }

  return { url, apiKey };
}

async function parseScriptResponse(response: Response): Promise<ScriptResponse> {
  if (!response.ok) throw new Error("GOOGLE_SCRIPT_UNAVAILABLE");

  const result = (await response.json()) as ScriptResponse;
  if (!result.ok) throw new Error(result.error || "GOOGLE_SCRIPT_ERROR");
  return result;
}

export async function googleScriptGet(parameters: Record<string, string>) {
  const { url, apiKey } = getConfiguration();
  const target = new URL(url);
  target.searchParams.set("apiKey", apiKey);

  Object.entries(parameters).forEach(([key, value]) => {
    if (value) target.searchParams.set(key, value);
  });

  const response = await fetch(target, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
  });

  return parseScriptResponse(response);
}

export async function googleScriptPost(payload: Record<string, unknown>) {
  const { url, apiKey } = getConfiguration();
  const response = await fetch(url, {
    method: "POST",
    redirect: "follow",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, apiKey }),
  });

  return parseScriptResponse(response);
}
