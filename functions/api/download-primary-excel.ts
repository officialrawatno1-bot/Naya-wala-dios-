export async function onRequest(context: any) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await context.request.json();
    const apiRes = await fetch("https://redesigned-winner-gx7rv659g97vhp7r9-8000.app.github.dev/api/download-primary-excel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const blob = await apiRes.arrayBuffer();

    return new Response(blob, {
      status: apiRes.status,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": "attachment; filename=CBO_Primary_Report.xls",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: "Download error: " + (err.message || String(err))
    }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
