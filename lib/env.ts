import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string(),

  // Emails
  EMAIL_FROM: z.string(),
  AUTH_RESEND_KEY: z.string(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // NextAuth
  AUTH_URL: z.string().optional(),
  AUTH_SECRET: z.string(),
  BASE_URL : z.string(),
  QSTASH_URL : z.string(),
  QSTASH_TOKEN : z.string(),
  QSTASH_CURRENT_SIGNING_KEY : z.string(),
  QSTASH_NEXT_SIGNING_KEY : z.string(),
});

export const env = schema.parse(process.env);
