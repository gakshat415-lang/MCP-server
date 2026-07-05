import { google } from "googleapis";
import { getAuthClient } from "../../auth/google-auth.js";
import {
  formatGoogleApiError,
  mcpErrorResponse,
  mcpSuccessResponse,
} from "../../utils/errors.js";

/**
 * Tool handler: append_to_doc
 *
 * Appends text content to the end of an existing Google Doc.
 */
export async function handleAppendToDoc(params: {
  document_id: string;
  content: string;
}) {
  try {
    const auth = getAuthClient();
    const docs = google.docs({ version: "v1", auth });

    // First, get the document to find the end index and title
    const docResponse = await docs.documents.get({
      documentId: params.document_id,
    });

    const doc = docResponse.data;
    const docTitle = doc.title ?? "Untitled Document";

    // The body content ends at endIndex - 1 (the last newline)
    // We insert at endIndex - 1 to append before the final newline
    const body = doc.body;
    if (!body?.content) {
      return mcpErrorResponse("Document body is empty or inaccessible.");
    }

    const lastElement = body.content[body.content.length - 1];
    const endIndex = lastElement?.endIndex ?? 1;

    // Insert text at the end of the document
    // Using endIndex - 1 to place content before the trailing newline
    const insertIndex = Math.max(endIndex - 1, 1);

    await docs.documents.batchUpdate({
      documentId: params.document_id,
      requestBody: {
        requests: [
          {
            insertText: {
              text: `\n${params.content}`,
              location: {
                index: insertIndex,
              },
            },
          },
        ],
      },
    });

    return mcpSuccessResponse(
      `✅ Content appended successfully!\n` +
        `Document: "${docTitle}"\n` +
        `Document ID: ${params.document_id}\n` +
        `Characters added: ${params.content.length}`
    );
  } catch (err) {
    return mcpErrorResponse(
      `Failed to append to document: ${formatGoogleApiError(err)}`
    );
  }
}
