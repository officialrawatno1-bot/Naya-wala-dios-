export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  try {
    const url = new URL(context.request.url);
    const taskId = url.searchParams.get("taskId") || "default";
    const apiRes = await fetch("https://super-duper-space-adventure-5vx7qxp6jp95h765r-8000.app.github.dev/api/extraction-status?taskId=" + encodeURIComponent(taskId), { headers: { "Accept": "application/json" } });
    const data = await apiRes.text();
    return new Response(data, { status: apiRes.status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ status: "failed", error: err.message }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
