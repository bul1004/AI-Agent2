/**
 * lib/server/utils/invitation-email.ts
 *
 * Organization invitation email sender using Resend
 */

import { Resend } from "resend";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";

// Lazy initialization to avoid build-time errors when API key is not set
let resendInstance: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}
const logger = createLogger("auth.invitation");

interface SendInvitationEmailParams {
  email: string;
  invitationId: string;
  organizationName: string;
  inviterName: string | null;
  inviterEmail: string | null;
}

/**
 * Send organization invitation email
 */
async function sendInvitationEmailImpl({
  email,
  invitationId,
  organizationName,
  inviterName,
  inviterEmail,
}: SendInvitationEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY is not configured, logging invite instead", {
      name: "auth.invitation.sendEmail",
      args: { toEmailLen: email.length, organizationName },
    });
    logger.info("Invitation email skipped in development", {
      name: "auth.invitation.sendEmail",
      args: {
        toEmailLen: email.length,
        organizationName,
        invitationIdLen: invitationId.length,
        inviterEmailLen: inviterEmail?.length ?? 0,
      },
    });
    return { success: true };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/invite/accept?id=${invitationId}`;

  const inviterDisplay = inviterName || inviterEmail || "Someone";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "AI Agent";
  const subject = `${inviterDisplay}さんから「${organizationName}」への招待`;

  const htmlContent = buildHtmlContent({
    appName,
    organizationName,
    inviterDisplay,
    acceptUrl,
  });

  const textContent = buildTextContent({
    appName,
    organizationName,
    inviterDisplay,
    acceptUrl,
  });

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
    const resend = getResend();
    if (!resend) {
      return { success: false, error: "Resend not configured" };
    }
    const { error } = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      logger.error("Email send error", {
        name: "auth.invitation.sendEmail",
        args: { toEmailLen: email.length, organizationName },
        err: { name: "ResendError", message: error.message, stack: undefined },
      });
      return { success: false, error: error.message };
    }

    // 外部API成功はinfoログを記録（logging-rules.md準拠）
    logger.info("Invitation email sent", {
      name: "auth.invitation.sendEmail",
      args: { toEmailLen: email.length, organizationName },
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Email send failed", {
      name: "auth.invitation.sendEmail",
      args: { toEmailLen: email.length, organizationName },
      err: serializeError(err),
    });
    return { success: false, error: message };
  }
}

export const sendInvitationEmail = withLog(sendInvitationEmailImpl, {
  name: "auth.invitation.sendEmail",
  pickArgs: ([params]) => ({
    toEmailLen: params.email.length,
    organizationName: params.organizationName,
    invitationIdLen: params.invitationId.length,
    inviterEmailLen: params.inviterEmail?.length ?? 0,
  }),
  sampleInfoRate: 0,
});

interface BuildContentParams {
  appName: string;
  organizationName: string;
  inviterDisplay: string;
  acceptUrl: string;
}

function buildHtmlContent({
  appName,
  organizationName,
  inviterDisplay,
  acceptUrl,
}: BuildContentParams): string {
  const escapedOrgName = escapeHtml(organizationName);
  const escapedInviter = escapeHtml(inviterDisplay);
  const escapedAppName = escapeHtml(appName);
  const safeAcceptUrl = escapeAttribute(acceptUrl);

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #000000; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #000000;">${escapedAppName}</h1>

      <p style="color: #000000; font-size: 16px;">
        <strong>${escapedInviter}</strong>さんから<strong>「${escapedOrgName}」</strong>への招待が届いています。
      </p>

      <p style="color: #666666; font-size: 14px; margin: 24px 0;">
        下のボタンをクリックして、組織に参加してください。
      </p>

      <p style="margin: 32px 0;">
        <a href="${safeAcceptUrl}"
           style="display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px;"
           target="_blank" rel="noopener noreferrer">
          招待を承認する
        </a>
      </p>

      <p style="color: #888888; font-size: 12px; margin-top: 32px;">
        このリンクは7日間有効です。
      </p>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p style="font-size: 12px; color: #888888;">
        このメールは${escapedAppName}から自動送信されています。<br />
        心当たりがない場合は、このメールを無視してください。
      </p>
    </div>
  `;
}

function buildTextContent({
  appName,
  organizationName,
  inviterDisplay,
  acceptUrl,
}: BuildContentParams): string {
  return `${appName}

${inviterDisplay}さんから「${organizationName}」への招待が届いています。

以下のリンクをクリックして、組織に参加してください：
${acceptUrl}

このリンクは7日間有効です。

---
このメールは${appName}から自動送信されています。
心当たりがない場合は、このメールを無視してください。
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
