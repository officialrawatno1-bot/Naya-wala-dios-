export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }
  try {
    const body = await context.request.json().catch(() => ({}));
    const targetUrl = "https://supreme-happiness-gx7vj4pgpwj42wpv7-8000.app.github.dev/api/send-email";
    
    const apiRes = await fetch(targetUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify(body)
    });
    
    const text = await apiRes.text();
    let jsonResp;
    try {
      jsonResp = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Backend returned non-JSON. Port 8000 may need to be public or server restarted: " + text.substring(0, 150) 
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify(jsonResp), {
      status: apiRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: "Cloudflare Bridge Error: " + (err.message || String(err)) }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
