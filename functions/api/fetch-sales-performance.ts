export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }
    });
  }
  try {
    const body = await context.request.json().catch(() => ({}));
    const url = new URL(context.request.url);
    const targetUrl = "https://supreme-happiness-gx7vj4pgpwj42wpv7-8000.app.github.dev/api/fetch-sales-performance" + url.search;
    const apiRes = await fetch(targetUrl, {
      method: context.request.method,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: context.request.method !== "GET" ? JSON.stringify(body) : undefined
    });
    const data = await apiRes.arrayBuffer();
    return new Response(data, {
      status: apiRes.status,
      headers: {
        "Content-Type": apiRes.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
