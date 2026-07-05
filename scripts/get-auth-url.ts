import { google } from "googleapis";
import * as fs from "node:fs";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/documents",
];

const CREDENTIALS_PATH = "client_secret_486681029279-u2ij3e967pet01thfmmq90221pof694p.apps.googleusercontent.com.json";
const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
const keys = JSON.parse(content);
const key = keys.installed || keys.web;

const oauth2Client = new google.auth.OAuth2(
  key.client_id,
  key.client_secret,
  key.redirect_uris[0]
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log(authUrl);
