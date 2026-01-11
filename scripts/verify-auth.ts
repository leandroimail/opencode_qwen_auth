import { readQwenCredentials } from "../src/qwen/credentials.js";

async function main() {
  console.log("Verifying Qwen Credentials...");
  const creds = await readQwenCredentials();
  if (creds) {
    console.log("Success! Found credentials.");
    console.log("Access Token (masked):", creds.access_token.substring(0, 10) + "...");
    console.log("Expiry Date:", new Date(creds.expiry_date).toLocaleString());
  } else {
    console.error("Failed to read credentials. Make sure ~/.qwen/oauth_creds.json exists.");
  }
}

main();
