import { Resend } from "resend";

const FROM = "Supplement Tracker <notifications@sup.danawilliams.dev>";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  return new Resend(process.env.RESEND_API_KEY);
}

type LowStockItem = {
  name: string;
  daysLeft: number;
};

export async function sendLowStockEmail(
  to: string,
  critical: LowStockItem[],
  warning: LowStockItem[],
) {
  if (critical.length === 0 && warning.length === 0) return;

  const subject =
    critical.length > 0
      ? `⚠️ ${critical.length} supplement${critical.length > 1 ? "s" : ""} running out this week`
      : `📦 ${warning.length} supplement${warning.length > 1 ? "s" : ""} running low`;

  const rows = (items: LowStockItem[], color: string) =>
    items
      .map(
        (i) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#0a0a0a;">${i.name}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;color:${color};text-align:right;">${i.daysLeft}d left</td>
      </tr>`,
      )
      .join("");

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="padding:32px 32px 24px;border-bottom:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#737373;">Supplement Tracker</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#0a0a0a;">${subject}</h1>
    </div>

    <div style="padding:24px 32px;">
      ${
        critical.length > 0
          ? `
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#ef4444;">Critical — less than 1 week</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border:1px solid #fee2e2;border-radius:8px;overflow:hidden;">
        ${rows(critical, "#ef4444")}
      </table>`
          : ""
      }

      ${
        warning.length > 0
          ? `
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#f59e0b;">Warning — less than 2 weeks</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #fef3c7;border-radius:8px;overflow:hidden;">
        ${rows(warning, "#f59e0b")}
      </table>`
          : ""
      }
    </div>

    <div style="padding:20px 32px;background:#f9f9f9;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:12px;color:#a3a3a3;">You're receiving this because you have low-stock alerts enabled.</p>
    </div>
  </div>
</body>
</html>`;

  await getResend().emails.send({ from: FROM, to, subject, html });
}
