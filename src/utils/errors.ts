/**
 * Error formatting utilities for MCP tool responses.
 */

/**
 * Extracts a human-readable error message from a Google API error.
 */
export function formatGoogleApiError(err: unknown): string {
  if (err instanceof Error) {
    // googleapis errors often have a response with data
    const apiErr = err as Error & {
      response?: { status?: number; data?: { error?: { message?: string } } };
      code?: number;
    };

    const status = apiErr.response?.status ?? apiErr.code;
    const message =
      apiErr.response?.data?.error?.message ?? apiErr.message;

    if (status) {
      return `Google API error (${status}): ${message}`;
    }
    return `Error: ${message}`;
  }

  return `Unknown error: ${String(err)}`;
}

/**
 * Creates a standard MCP error response object.
 */
export function mcpErrorResponse(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

/**
 * Creates a standard MCP success response object.
 */
export function mcpSuccessResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}
