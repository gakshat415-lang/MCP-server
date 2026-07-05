import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handleSendEmail } from "./tools/gmail/send-email.js";
import { handleDraftEmail } from "./tools/gmail/draft-email.js";
import { handleAppendToDoc } from "./tools/docs/append-to-doc.js";

/**
 * GWS MCP Server
 *
 * A generic MCP server exposing Gmail and Google Docs tools.
 * Any MCP-compatible AI agent can discover and invoke these tools.
 */
const server = new McpServer({
  name: "gws-mcp-server",
  version: "1.0.0",
});

// ─── Gmail: send_email ──────────────────────────────────────────────────────

server.tool(
  "send_email",
  "Send an email immediately via Gmail. Supports plain text and HTML bodies.",
  {
    to: z.string().describe("Recipient email address (required)"),
    subject: z.string().describe("Email subject line (required)"),
    body: z.string().describe("Plain text email body (required)"),
    cc: z
      .string()
      .optional()
      .describe("CC recipient email address (optional)"),
    bcc: z
      .string()
      .optional()
      .describe("BCC recipient email address (optional)"),
    html_body: z
      .string()
      .optional()
      .describe(
        "HTML email body (optional). When provided, a multipart message is sent with both plain text and HTML."
      ),
  },
  async (params) => {
    return handleSendEmail(params);
  }
);

// ─── Gmail: draft_email ─────────────────────────────────────────────────────

server.tool(
  "draft_email",
  "Save an email as a draft in Gmail. The draft can be reviewed and sent later from the Gmail UI.",
  {
    to: z.string().describe("Recipient email address (required)"),
    subject: z.string().describe("Email subject line (required)"),
    body: z.string().describe("Plain text email body (required)"),
    cc: z
      .string()
      .optional()
      .describe("CC recipient email address (optional)"),
    bcc: z
      .string()
      .optional()
      .describe("BCC recipient email address (optional)"),
    html_body: z
      .string()
      .optional()
      .describe(
        "HTML email body (optional). When provided, a multipart draft is created with both plain text and HTML."
      ),
  },
  async (params) => {
    return handleDraftEmail(params);
  }
);

// ─── Google Docs: append_to_doc ─────────────────────────────────────────────

server.tool(
  "append_to_doc",
  "Append text content to the end of an existing Google Doc. Useful for logging results, building reports, or maintaining living documents.",
  {
    document_id: z
      .string()
      .describe(
        "The Google Doc document ID. Found in the document URL: https://docs.google.com/document/d/{DOCUMENT_ID}/edit"
      ),
    content: z
      .string()
      .describe("The text content to append to the end of the document"),
  },
  async (params) => {
    return handleAppendToDoc(params);
  }
);

// ─── Start Server ───────────────────────────────────────────────────────────

async function main() {
  const port = process.env.PORT;

  if (port) {
    // Cloud Deployment Mode (SSE Transport)
    const app = express();
    const transports: Record<string, SSEServerTransport> = {};

    // Health check endpoint for UptimeRobot
    app.get("/", (req, res) => {
      res.send("MCP Server is running!");
    });

    app.get("/sse", async (req, res) => {
      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;

      res.on("close", () => {
        delete transports[transport.sessionId];
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];

      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("No transport found for sessionId");
      }
    });

    app.listen(port, () => {
      console.error(`🚀 gws-mcp-server started (SSE transport) on port ${port}`);
      console.error("   Tools: send_email, draft_email, append_to_doc");
    });
  } else {
    // Local Mode (Stdio Transport)
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log to stderr — stdout is reserved for MCP protocol messages
    console.error("🚀 gws-mcp-server started (stdio transport)");
    console.error("   Tools: send_email, draft_email, append_to_doc");
  }
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
