import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

/**
 * OAuth 2.0 scopes required by the MCP server tools.
 */
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/documents",
];

/**
 * Path to the local JSON file for persisting OAuth tokens.
 * Defaults to ~/.gws-mcp/tokens.json
 */
const TOKEN_DIR = path.join(os.homedir(), ".gws-mcp");
const TOKEN_PATH = path.join(TOKEN_DIR, "tokens.json");

/** Cached auth client singleton */
let cachedClient: OAuth2Client | null = null;

/**
 * Reads persisted tokens from the local JSON file.
 */
function loadTokens(): Record<string, string> | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const raw = fs.readFileSync(TOKEN_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    console.error(`[auth] Failed to read tokens from ${TOKEN_PATH}`);
  }
  return null;
}

/**
 * Persists tokens to the local JSON file.
 */
function saveTokens(tokens: Record<string, unknown>): void {
  try {
    if (!fs.existsSync(TOKEN_DIR)) {
      fs.mkdirSync(TOKEN_DIR, { recursive: true });
    }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
    console.error(`[auth] Tokens saved to ${TOKEN_PATH}`);
  } catch (err) {
    console.error(`[auth] Failed to save tokens: ${err}`);
  }
}

/**
 * Returns a configured OAuth2Client ready for Google API calls.
 *
 * Token resolution order:
 *   1. Local JSON file (~/.gws-mcp/tokens.json)
 *   2. Environment variable GOOGLE_REFRESH_TOKEN
 *
 * On first use the refresh token is persisted to the JSON file
 * so subsequent runs don't require the env var.
 */
export function getAuthClient(): OAuth2Client {
  if (cachedClient) return cachedClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables. " +
        "See .env.example for required configuration."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

  // Try loading tokens from file first, fall back to env var
  const storedTokens = loadTokens();

  if (storedTokens?.refresh_token) {
    oauth2Client.setCredentials(storedTokens);
    console.error("[auth] Loaded tokens from local file");
  } else {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error(
        "No refresh token found. Provide GOOGLE_REFRESH_TOKEN in env vars " +
          `or place tokens in ${TOKEN_PATH}`
      );
    }
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    // Persist for next time
    saveTokens({ refresh_token: refreshToken });
    console.error("[auth] Using refresh token from environment, saved to file");
  }

  // Listen for token refreshes and persist updated tokens
  oauth2Client.on("tokens", (tokens) => {
    const existing = loadTokens() ?? {};
    const merged = { ...existing, ...tokens };
    saveTokens(merged);
    console.error("[auth] Access token refreshed and saved");
  });

  cachedClient = oauth2Client;
  return oauth2Client;
}

/**
 * Returns the Gmail user email from environment configuration.
 */
export function getGmailUserEmail(): string {
  const email = process.env.GMAIL_USER_EMAIL;
  if (!email) {
    throw new Error(
      "Missing GMAIL_USER_EMAIL environment variable. " +
        "This should be the email address associated with your OAuth credentials."
    );
  }
  return email;
}
