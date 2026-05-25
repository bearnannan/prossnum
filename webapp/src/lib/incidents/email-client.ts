import nodemailer from "nodemailer";
import { getIncidentConfigAsync } from "./config";
import type { NotificationPayload } from "./types";

export async function sendEmailNotification(
  payload: NotificationPayload,
  status: string,
  incidentNo: string,
  statusColor: string
): Promise<{ success: boolean; message: string }> {
  const config = await getIncidentConfigAsync();

  // Construct a premium dark-themed HTML email body matching the NEXCORE design guidelines
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>แจ้งเหตุซ่อมบำรุง - ${incidentNo}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #0a0a0f;
          color: #e2e8f0;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #12121a;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .header {
          background-color: ${statusColor};
          padding: 24px;
          color: #0a0a0f;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 6px 0 0 0;
          font-size: 14px;
          font-weight: bold;
          opacity: 0.8;
        }
        .body {
          padding: 24px;
        }
        .accent-line {
          height: 2px;
          background-color: ${statusColor};
          margin-bottom: 24px;
        }
        .data-row {
          margin-bottom: 16px;
        }
        .label {
          font-size: 11px;
          font-weight: bold;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .value {
          font-size: 14px;
          font-weight: bold;
          color: #f8fafc;
        }
        .status-badge {
          display: inline-block;
          background-color: ${statusColor}1c;
          border: 1px solid ${statusColor}55;
          border-radius: 6px;
          padding: 10px 14px;
          margin-top: 10px;
          margin-bottom: 16px;
        }
        .status-badge .status-label {
          font-size: 11px;
          font-weight: bold;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .status-badge .status-value {
          font-size: 14px;
          font-weight: bold;
          color: ${statusColor};
          margin-top: 4px;
        }
        .footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 11px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>แจ้งเหตุซ่อมบำรุง</h1>
          <p>${incidentNo}</p>
        </div>
        <div class="body">
          <div class="accent-line"></div>
          
          <div class="data-row">
            <div class="label">วันที่และเวลาแจ้งเหตุ</div>
            <div class="value">${payload["วันที่และเวลาแจ้งเหตุ"] || "-"}</div>
          </div>
          <div class="data-row">
            <div class="label">สถานี</div>
            <div class="value">${payload["สถานี"] || "-"}</div>
          </div>
          <div class="data-row">
            <div class="label">ผู้แจ้งเหตุ</div>
            <div class="value">${payload["ผู้แจ้งเหตุ"] || "-"}</div>
          </div>
          <div class="data-row">
            <div class="label">อาการเสีย</div>
            <div class="value">${payload["อาการเสีย"] || "-"}</div>
          </div>
          <div class="data-row">
            <div class="label">ประเภทอุปกรณ์</div>
            <div class="value">${payload.equipmentType || "-"}</div>
          </div>
          <div class="data-row">
            <div class="label">ผู้เข้าดำเนินการ</div>
            <div class="value">${payload["ผู้เข้าดำเนินการ"] || "-"}</div>
          </div>
          
          <div class="status-badge">
            <div class="status-label">สถานะการแก้ไข</div>
            <div class="status-value">● ${status || "รอดำเนินการ"}</div>
          </div>
          
          <div class="data-row">
            <div class="label">เบอร์โทรผู้แจ้งเหตุ</div>
            <div class="value">${payload["เบอร์โทรผู้แจ้งเหตุ"] || "-"}</div>
          </div>
          <div class="data-row">
            <div class="label">เบอร์โทรติดต่อ</div>
            <div class="value">${payload["เบอร์โทร"] || "-"}</div>
          </div>
        </div>
        <div class="footer">
          ระบบรายงานเหตุขัดข้องอัตโนมัติ (Fallback Notification Server)
        </div>
      </div>
    </body>
    </html>
  `;

  // Resilient Console Mocking fallback if SMTP settings are missing
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword || !config.fallbackEmailTo) {
    console.info("\n=========================================================================");
    console.info("⚡ [MOCK FALLBACK EMAIL NOTIFICATION DISPATCHED] ⚡");
    console.info(`Recipient: ${config.fallbackEmailTo || "[NOT CONFIGURED - Please configure in Settings/env]"}`);
    console.info(`Subject: [FALLBACK ALERT] แจ้งเหตุซ่อมบำรุง ${incidentNo} - ${payload["สถานี"]}`);
    console.info(`Status: ${status} (Color: ${statusColor})`);
    console.info(`Station: ${payload["สถานี"]}`);
    console.info(`Issue: ${payload["อาการเสีย"]}`);
    console.info(`Note: To enable real Microsoft 365 routing, fill in the credentials in settings or .env.local.`);
    console.info("=========================================================================\n");
    return {
      success: true,
      message: "Fallback Email Mocked successfully (SMTP credentials missing)",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // STARTTLS uses port 587 (secure: false)
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"Prossnum Fallback Monitor" <${config.smtpUser}>`,
      to: config.fallbackEmailTo,
      subject: `[FALLBACK ALERT] แจ้งเหตุซ่อมบำรุง ${incidentNo} - ${payload["สถานี"]}`,
      html: htmlBody,
    });

    console.info(`[Fallback Email Success] Email sent successfully to ${config.fallbackEmailTo}`);
    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (err: any) {
    console.error("[Fallback Email Error] Failed to send email through SMTP:", err);
    return {
      success: false,
      message: err.message || "Failed to send email",
    };
  }
}
