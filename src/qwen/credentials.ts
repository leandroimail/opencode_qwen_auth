import fs from "fs/promises";
import path from "path";
import os from "os";

export interface QwenCredentials {
  access_token: string;
  token_type: string;
  refresh_token: string;
  resource_url: string;
  expiry_date: number;
}

const CREDENTIALS_PATH = path.join(os.homedir(), ".qwen", "oauth_creds.json");

export async function readQwenCredentials(): Promise<QwenCredentials | null> {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(content) as QwenCredentials;
  } catch (error) {
    return null;
  }
}
