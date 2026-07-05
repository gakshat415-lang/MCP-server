import { google } from "googleapis";
import { getAuthClient, getGmailUserEmail } from "../../auth/google-auth.js";
import {
  formatGoogleApiError,
  mcpErrorResponse,
  mcpSuccessResponse,
} from "../../utils/errors.js";

/**
 * Builds an RFC 2822 compliant email message string.
 */
export function buildRawMessage(params: {
  to: string;
  subject: string;
  body: string;
  from: string;
  cc?: string;
  bcc?: string;
  htmlBody?: string;
}): string {
  const { to, subject, body, from, cc, bcc, htmlBody } = params;

  const headers: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
  ];

  if (cc) headers.push(`Cc: ${cc}`);
  if (bcc) headers.push(`Bcc: ${bcc}`);

  if (htmlBody) {
    // Multipart message with both plain text and HTML
    const boundary = `boundary_${Date.now()}`;
    headers.push("MIME-Version: 1.0");
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    const messageParts = [
      headers.join("\r\n"),
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      htmlBody,
      `--${boundary}--`,
    ];

    return messageParts.join("\r\n");
  }

  // Plain text only
  headers.push("MIME-Version: 1.0");
  headers.push("Content-Type: text/plain; charset=UTF-8");

  return [headers.join("\r\n"), "", body].join("\r\n");
}

/**
 * Encodes a raw email string to Base64URL format for the Gmail API.
 */
export function encodeMessage(rawMessage: string): string {
  return Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Tool handler: send_email
 *
 * Sends an email immediately via the Gmail API.
 */
export async function handleSendEmail(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  html_body?: string;
}) {
  try {
    const auth = getAuthClient();
    const userEmail = getGmailUserEmail();
    const gmail = google.gmail({ version: "v1", auth });

    const rawMessage = buildRawMessage({
      to: params.to,
      subject: params.subject,
      body: params.body,
      from: userEmail,
      cc: params.cc,
      bcc: params.bcc,
      htmlBody: params.html_body,
    });

    const encoded = encodeMessage(rawMessage);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });

    const messageId = response.data.id;
    return mcpSuccessResponse(
      `✅ Email sent successfully!\n` +
        `Message ID: ${messageId}\n` +
        `To: ${params.to}\n` +
        `Subject: ${params.subject}`
    );
  } catch (err) {
    return mcpErrorResponse(
      `Failed to send email: ${formatGoogleApiError(err)}`
    );
  }
}
