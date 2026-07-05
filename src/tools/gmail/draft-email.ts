import { google } from "googleapis";
import { getAuthClient, getGmailUserEmail } from "../../auth/google-auth.js";
import { buildRawMessage, encodeMessage } from "./send-email.js";
import {
  formatGoogleApiError,
  mcpErrorResponse,
  mcpSuccessResponse,
} from "../../utils/errors.js";

/**
 * Tool handler: draft_email
 *
 * Saves an email as a draft in Gmail.
 */
export async function handleDraftEmail(params: {
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

    const response = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: { raw: encoded },
      },
    });

    const draftId = response.data.id;
    return mcpSuccessResponse(
      `✅ Draft saved successfully!\n` +
        `Draft ID: ${draftId}\n` +
        `To: ${params.to}\n` +
        `Subject: ${params.subject}`
    );
  } catch (err) {
    return mcpErrorResponse(
      `Failed to create draft: ${formatGoogleApiError(err)}`
    );
  }
}
