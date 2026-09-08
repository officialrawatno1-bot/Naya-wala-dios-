export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;

  // 🌟 Strict Anti-Cache Headers for Safari & Edge CDN
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.DIOS_STORAGE) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Cloudflare KV binding 'DIOS_STORAGE' not found."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(request.url);

    if (method === "GET") {
      const action = url.searchParams.get("action");
      const key = url.searchParams.get("key");
      const prefix = url.searchParams.get("prefix") || "";

      // Action A: History Snapshots
      if (action === "history" && key) {
        const cleanPrefix = `backups/${key.replace(/\//g, '_')}_`;
        const listRes = await env.DIOS_STORAGE.list({ prefix: cleanPrefix, limit: 15 });
        const historyItems = (listRes.keys || []).map((k: any) => ({
          snapshotKey: k.name,
          timestamp: k.name.replace(cleanPrefix, '')
        }));
        return new Response(
          JSON.stringify({ success: true, key, history: historyItems }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Action B: List keys
      if (action === "list") {
        const listRes = await env.DIOS_STORAGE.list({ prefix });
        return new Response(
          JSON.stringify({ success: true, prefix, keys: listRes.keys }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Action C: Fetch specific sheet data
      if (key) {
        const raw = await env.DIOS_STORAGE.get(key);
        if (!raw) {
          return new Response(
            JSON.stringify({ success: true, key, data: null, message: "No cloud data found" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const parsed = JSON.parse(raw);
        return new Response(
          JSON.stringify({ success: true, key, ...parsed }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: "online", binding: "DIOS_STORAGE" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.key || body.data === undefined) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid payload." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { key, data, device = "iPad Safari", createSnapshot = true } = body;
      const now = new Date().toISOString();

      const payload = {
        data,
        updatedAt: now,
        device
      };

      await env.DIOS_STORAGE.put(key, JSON.stringify(payload));

      if (createSnapshot) {
        const safeKey = key.replace(/\//g, '_');
        const snapshotKey = `backups/${safeKey}_${now}`;
        await env.DIOS_STORAGE.put(snapshotKey, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 24 * 30
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          key,
          updatedAt: now,
          device,
          message: "Saved to Cloudflare KV"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
