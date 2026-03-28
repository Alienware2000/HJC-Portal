import { z } from "zod";

export const accessCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Access code is required")
    .transform((val) => val.trim().toUpperCase()),
});

export const emailLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;
