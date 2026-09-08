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
    const apiRes = await fetch("https://supreme-happiness-gx7vj4pgpwj42wpv7-8000.app.github.dev/api/fetch-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await apiRes.text();
    return new Response(data, {
      status: apiRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: "Backend Bridge Error: " + err.message }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}
