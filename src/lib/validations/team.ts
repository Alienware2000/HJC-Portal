import { z } from "zod";

export const createTeamMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(200).trim(),
  role: z.enum(["admin", "staff"], { required_error: "Please select a role" }),
});

export const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  newRole: z.enum(["admin", "staff"]),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const changeOwnPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;
