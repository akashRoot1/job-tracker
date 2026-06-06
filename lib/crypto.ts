import crypto from "node:crypto";
import { config } from "@/lib/config";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  if (!config.tokenEncryptionKey) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to encrypt OAuth tokens.");
  }
  const key = Buffer.from(config.tokenEncryptionKey, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a 32-byte base64 encoded value.");
  }
  return key;
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Invalid encrypted token payload.");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final()
  ]).toString("utf8");
}
