import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Sends a password reset email using Brevo's Transactional Email REST API.
   * If BREVO_API_KEY is not set (e.g. in local development or test), it logs the
   * reset URL to the console so developers and admins can test the flow immediately.
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const fromEmail = process.env.MAIL_FROM?.trim() || "no-reply@edops.app";
    const fromName = process.env.MAIL_FROM_NAME?.trim() || "EDOPS Platform";
    const appUrl = (
      process.env.APP_URL?.trim() || "http://localhost:3000"
    ).replace(/\/$/, "");
    const resetUrl = `${appUrl}/?reset=${encodeURIComponent(resetToken)}`;

    if (!apiKey) {
      this.logger.warn(
        `BREVO_API_KEY is not set. Falling back to local console delivery.`,
      );
      console.log(
        `\n================= [EDOPS PASSWORD RESET] =================`,
      );
      console.log(`Recipient: ${to} (${userName || "User"})`);
      console.log(`Action: Password Reset Requested`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${resetToken}`);
      console.log(`Expires in: 30 minutes`);
      console.log(
        `==========================================================\n`,
      );
      return { success: true, messageId: "dev-console-fallback" };
    }

    const payload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to, name: userName || to.split("@")[0] }],
      subject: "Reset your EDOPS account password",
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your EDOPS password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <tr>
                    <td>
                      <div style="margin-bottom: 24px;">
                        <span style="font-size: 22px; font-weight: 700; color: #020617; letter-spacing: -0.5px;">EDOPS</span>
                        <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-top: 2px;">Campus Operations</span>
                      </div>
                      
                      <h1 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">Password Reset Request</h1>
                      
                      <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
                        Hello${userName ? " " + userName : ""},<br/>
                        We received a request to reset your password for your EDOPS account (<b>${to}</b>).
                      </p>

                      <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 28px 0;">
                        Click the button below to choose a new password. This link is valid for <b>30 minutes</b>.
                      </p>

                      <div style="text-align: center; margin-bottom: 28px;">
                        <a href="${resetUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          Reset Password
                        </a>
                      </div>

                      <p style="font-size: 12px; line-height: 18px; color: #94a3b8; margin: 0 0 16px 0;">
                        If the button above does not work, copy and paste this link into your browser:
                      </p>
                      <p style="font-size: 12px; line-height: 18px; word-break: break-all; color: #3b82f6; margin: 0 0 28px 0;">
                        <a href="${resetUrl}" style="color: #3b82f6; text-decoration: underline;">${resetUrl}</a>
                      </p>

                      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

                      <p style="font-size: 12px; line-height: 18px; color: #94a3b8; margin: 0;">
                        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Brevo API returned error status ${response.status}: ${errorBody}`,
        );
        console.log(
          `\n[FALLBACK CONSOLE RESET LINK] Brevo delivery failed. Direct reset URL for ${to}:\n${resetUrl}\n`,
        );
        return { success: false };
      }

      const result = (await response.json()) as { messageId?: string };
      this.logger.log(
        `Password reset email successfully dispatched via Brevo to ${to}. MessageId: ${result.messageId}`,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email via Brevo: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(
        `\n[FALLBACK CONSOLE RESET LINK] Delivery error. Direct reset URL for ${to}:\n${resetUrl}\n`,
      );
      return { success: false };
    }
  }

  /**
   * Sends an invitation email to a new member (admin, teacher, student, parent) via Brevo.
   * Falls back to logging the invitation URL if Brevo is not configured or in development.
   */
  async sendInvitationEmail(
    to: string,
    token: string,
    role: string,
    schoolName?: string,
    name?: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    const fromEmail = process.env.MAIL_FROM?.trim() || "no-reply@edops.app";
    const fromName = process.env.MAIL_FROM_NAME?.trim() || "EDOPS Platform";
    const appUrl = (
      process.env.APP_URL?.trim() || "http://localhost:3000"
    ).replace(/\/$/, "");
    const inviteUrl = `${appUrl}/?invite=${encodeURIComponent(token)}`;
    const roleLabel = role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (!apiKey) {
      this.logger.warn(
        `BREVO_API_KEY is not set. Falling back to console delivery.`,
      );
      console.log(
        `\n================= [EDOPS INVITATION LINK] =================`,
      );
      console.log(`Recipient: ${to} (${name || "Member"})`);
      console.log(`Role: ${roleLabel} | School: ${schoolName || "Campus"}`);
      console.log(`Invite URL: ${inviteUrl}`);
      console.log(`Token: ${token}`);
      console.log(`Expires in: 48 hours`);
      console.log(
        `==========================================================\n`,
      );
      return { success: true, messageId: "dev-console-fallback" };
    }

    const payload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to, name: name || to.split("@")[0] }],
      subject: `Invitation to join ${schoolName || "EDOPS"} as ${roleLabel}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Invitation to EDOPS</title></head>
        <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
          <table width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;">
            <tr><td align="center">
              <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr><td>
                  <span style="font-size:22px;font-weight:700;color:#020617;">EDOPS</span>
                  <h1 style="font-size:20px;font-weight:600;color:#0f172a;margin:20px 0 16px 0;">You're Invited!</h1>
                  <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 20px 0;">
                    Hello${name ? " " + name : ""},<br/>
                    You have been invited to join <b>${schoolName || "EDOPS Campus"}</b> as a <b>${roleLabel}</b>.
                  </p>
                  <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 28px 0;">
                    Click the button below to accept your invitation and create your account password.
                  </p>
                  <div style="text-align:center;margin-bottom:28px;">
                    <a href="${inviteUrl}" style="background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;display:inline-block;">
                      Accept Invitation & Set Password
                    </a>
                  </div>
                  <p style="font-size:12px;color:#94a3b8;margin:24px 0 0 0;">
                    This one-time link is valid for 48 hours. If you did not expect this invitation, you can safely ignore this email.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Brevo invitation email error status ${response.status}: ${errorBody}`,
        );
        console.log(
          `\n[FALLBACK CONSOLE INVITATION LINK] Brevo delivery failed. Direct invite URL for ${to}:\n${inviteUrl}\n`,
        );
        return { success: false };
      }

      const result = (await response.json()) as { messageId?: string };
      this.logger.log(
        `Invitation email sent via Brevo to ${to}. MessageId: ${result.messageId}`,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send invitation email via Brevo: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.log(
        `\n[FALLBACK CONSOLE INVITATION LINK] Delivery error. Direct invite URL for ${to}:\n${inviteUrl}\n`,
      );
      return { success: false };
    }
  }
}
