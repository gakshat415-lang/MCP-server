import { google } from "googleapis";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const CREDENTIALS_PATH = "client_secret_486681029279-u2ij3e967pet01thfmmq90221pof694p.apps.googleusercontent.com.json";
const TOKEN_DIR = path.join(os.homedir(), ".gws-mcp");
const TOKEN_PATH = path.join(TOKEN_DIR, "tokens.json");

const code = process.argv[2];
if (!code) {
  console.error("Please provide the authorization code as an argument.");
  process.exit(1);
}

async function main() {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris[0]
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!fs.existsSync(TOKEN_DIR)) {
      fs.mkdirSync(TOKEN_DIR, { recursive: true });
    }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`\n✅ Tokens successfully saved to ${TOKEN_PATH}`);
    
    console.log("\nUpdate your .env file with these credentials:");
    console.log(`GOOGLE_CLIENT_ID=${key.client_id}`);
    console.log(`GOOGLE_CLIENT_SECRET=${key.client_secret}`);
    if (tokens.refresh_token) {
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    }
    
  } catch (err) {
    console.error("Failed to generate tokens:", err);
  }
}
main();
