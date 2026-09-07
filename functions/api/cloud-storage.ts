export async function onRequest(context: any) {
  const { request, env } = context;
  const method = request.method;

  // 1. CORS Preflight Handling
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Verify KV Binding exists
  if (!env.DIOS_STORAGE) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Cloudflare KV binding 'DIOS_STORAGE' not found in environment."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(request.url);

    // ========================================================
    // GET: Read data, list keys, or fetch backup history
    // ========================================================
    if (method === "GET") {
      const action = url.searchParams.get("action");
      const key = url.searchParams.get("key");
      const prefix = url.searchParams.get("prefix") || "";

      // Action A: List available backup snapshots for Undo/Restore
      if (action === "history" && key) {
        const cleanPrefix = `backups/${key.replace(/\//g, '_')}_`;
        const listRes = await env.DIOS_STORAGE.list({ prefix: cleanPrefix, limit: 10 });
        const historyItems = (listRes.keys || []).map((k: any) => ({
          snapshotKey: k.name,
          timestamp: k.name.replace(cleanPrefix, '')
        }));
        return new Response(
          JSON.stringify({ success: true, key, history: historyItems }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Action B: List keys under a folder prefix
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
            JSON.stringify({ success: true, key, data: null, message: "No cloud data found for key" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const parsed = JSON.parse(raw);
        return new Response(
          JSON.stringify({ success: true, key, ...parsed }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Action D: Status / Health check
      return new Response(
        JSON.stringify({
          success: true,
          status: "online",
          engine: "Cloudflare Serverless KV Engine v1.0",
          binding: "DIOS_STORAGE"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================
    // POST: Save sheet data & auto-create backup snapshot
    // ========================================================
    if (method === "POST") {
      const body = await request.json().catch(() => null);
      if (!body || !body.key || body.data === undefined) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid payload. 'key' and 'data' are required." }),
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

      // 1. Save to main key (e.g. review/sheet_14_msl)
      await env.DIOS_STORAGE.put(key, JSON.stringify(payload));

      // 2. Auto-create backup snapshot under backups/ (30-day auto retention)
      if (createSnapshot) {
        const safeKey = key.replace(/\//g, '_');
        const snapshotKey = `backups/${safeKey}_${now}`;
        await env.DIOS_STORAGE.put(snapshotKey, JSON.stringify(payload), {
          expirationTtl: 60 * 60 * 24 * 30 // 30 Days auto expire
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          key,
          updatedAt: now,
          device,
          message: "Saved to Cloudflare KV with auto-backup snapshot"
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
