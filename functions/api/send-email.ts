import { connect } from 'cloudflare:sockets';

class SmtpClient {
  private socket: any;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder('utf-8');
  private encoder = new TextEncoder();
  private buffer = '';

  constructor(socket: any) {
    this.socket = socket;
    this.writer = socket.writable.getWriter();
    this.reader = socket.readable.getReader();
  }

  async readReply(): Promise<{ code: number; text: string }> {
    while (true) {
      const lines = this.buffer.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.length >= 3 && /^\d{3} /.test(line)) {
          const code = parseInt(line.substring(0, 3), 10);
          const fullReply = lines.slice(0, i + 1).join('\n');
          this.buffer = lines.slice(i + 1).join('\r\n');
          return { code, text: fullReply };
        }
      }

      const { value, done } = await this.reader.read();
      if (done) {
        throw new Error('SMTP connection closed by Google server.');
      }
      this.buffer += this.decoder.decode(value, { stream: true });
    }
  }

  async sendCommand(cmd: string): Promise<{ code: number; text: string }> {
    await this.writer.write(this.encoder.encode(cmd + '\r\n'));
    return await this.readReply();
  }

  async writeRaw(data: string): Promise<void> {
    await this.writer.write(this.encoder.encode(data));
  }

  async close() {
    try {
      await this.writer.releaseLock();
      await this.reader.releaseLock();
      await this.socket.close();
    } catch (e) {}
  }
}

export async function onRequest(context: any) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload = await context.request.json().catch(() => ({}));
    const smtpCfg = payload.smtp_config || {};

    const senderEmail = (smtpCfg.sender_email || "").trim();
    const appKey = (smtpCfg.app_key || "").replace(/\s+/g, "").trim();

    let recipients = payload.recipients || [];
    if (typeof recipients === "string") {
      recipients = [recipients];
    }
    recipients = recipients.filter((r: any) => typeof r === "string" && r.trim().length > 0);

    if (!senderEmail) {
      return new Response(JSON.stringify({ success: false, error: "Sender Gmail address is required." }), { status: 400, headers: corsHeaders });
    }
    if (!appKey) {
      return new Response(JSON.stringify({ success: false, error: "Google 16-Digit Security Key is required." }), { status: 400, headers: corsHeaders });
    }
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No recipient email specified." }), { status: 400, headers: corsHeaders });
    }

    const subject = payload.subject || "DIOS Reports Submission";
    const bodyText = payload.body || "Please find attached the reports.";
    const attachments = payload.attachments || [];

    // 🌟 1. CONNECT DIRECTLY TO GOOGLE SMTPS (PORT 465) FROM CLOUDFLARE CLOUD
    const socket = connect(
      { hostname: "smtp.gmail.com", port: 465 },
      { secureTransport: "on" }
    );
    const client = new SmtpClient(socket);

    // 2. Read 220 Greeting
    const greeting = await client.readReply();
    if (greeting.code !== 220) {
      await client.close();
      throw new Error("Google greeting rejected: " + greeting.text);
    }

    // 3. Send EHLO
    const ehlo = await client.sendCommand("EHLO localhost");
    if (ehlo.code !== 250) {
      await client.close();
      throw new Error("EHLO failed: " + ehlo.text);
    }

    // 4. AUTH LOGIN using 16-digit key
    const authStart = await client.sendCommand("AUTH LOGIN");
    if (authStart.code !== 334) {
      await client.close();
      throw new Error("AUTH LOGIN rejected: " + authStart.text);
    }

    const userB64 = btoa(senderEmail);
    const userRes = await client.sendCommand(userB64);
    if (userRes.code !== 334) {
      await client.close();
      throw new Error("Sender Email rejected: " + userRes.text);
    }

    const passB64 = btoa(appKey);
    const passRes = await client.sendCommand(passB64);
    if (passRes.code !== 235) {
      await client.close();
      throw new Error("Google Authentication Failed: Invalid 16-Digit Key or Email (" + passRes.text + "). Please verify at myaccount.google.com/apppasswords");
    }

    // 5. MAIL FROM
    const mailFrom = await client.sendCommand(`MAIL FROM:<${senderEmail}>`);
    if (mailFrom.code !== 250) {
      await client.close();
      throw new Error("MAIL FROM rejected: " + mailFrom.text);
    }

    // 6. RCPT TO for each recipient
    for (const rec of recipients) {
      const rcpt = await client.sendCommand(`RCPT TO:<${rec.trim()}>`);
      if (rcpt.code !== 250 && rcpt.code !== 251) {
        await client.close();
        throw new Error(`Recipient <${rec}> rejected: ` + rcpt.text);
      }
    }

    // 7. DATA Command
    const dataCmd = await client.sendCommand("DATA");
    if (dataCmd.code !== 354) {
      await client.close();
      throw new Error("DATA command rejected: " + dataCmd.text);
    }

    // 8. Build Full MIME Payload with Attachments
    const boundary = "----=_Part_" + Date.now() + "_" + Math.random().toString(36).substring(2);
    let mime = "";
    mime += `From: "Banwari Lal Meena (DIOS)" <${senderEmail}>\r\n`;
    mime += `To: ${recipients.join(", ")}\r\n`;
    mime += `Subject: ${subject}\r\n`;
    mime += `MIME-Version: 1.0\r\n`;
    mime += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

    // Plain text message body
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/plain; charset=UTF-8\r\n`;
    mime += `Content-Transfer-Encoding: 8bit\r\n\r\n`;
    mime += `${bodyText}\r\n\r\n`;

    // Attached Files
    for (const att of attachments) {
      const fname = att.filename || "Report.xlsx";
      const b64Data = att.content_base64 || "";
      if (b64Data) {
        const mimeType = fname.endsWith(".pdf") 
          ? "application/pdf" 
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        mime += `--${boundary}\r\n`;
        mime += `Content-Type: ${mimeType}; name="${fname}"\r\n`;
        mime += `Content-Disposition: attachment; filename="${fname}"\r\n`;
        mime += `Content-Transfer-Encoding: base64\r\n\r\n`;

        const chunks = b64Data.match(/.{1,76}/g) || [b64Data];
        mime += chunks.join("\r\n") + "\r\n\r\n";
      }
    }

    mime += `--${boundary}--\r\n`;
    mime += `\r\n.\r\n`;

    // 9. Stream to Google
    await client.writeRaw(mime);
    const finishRes = await client.readReply();
    if (finishRes.code !== 250) {
      await client.close();
      throw new Error("Email sending failed: " + finishRes.text);
    }

    // 10. QUIT cleanly
    try {
      await client.sendCommand("QUIT");
    } catch (e) {}
    await client.close();

    return new Response(JSON.stringify({
      success: true,
      message: `Delivered successfully to ${recipients.length} recipient(s) directly via Cloudflare SMTPS!`,
      recipients: recipients,
      attachments_count: attachments.length
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: "Cloudflare Direct SMTP Error: " + (err.message || String(err))
    }), { status: 500, headers: corsHeaders });
  }
}
