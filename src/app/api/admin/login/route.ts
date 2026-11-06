import { z } from "zod";
import { ApiError, handle } from "@/lib/api";
import { createAdminSession, isCorrectPassword } from "@/lib/admin-auth";
import { getServerEnv } from "@/env";

const loginSchema = z.object({ password: z.string().min(1) });

export const POST = handle(async (req) => {
  const { password } = loginSchema.parse(await req.json());

  const { ADMIN_PASSWORD } = getServerEnv();
  if (!ADMIN_PASSWORD) {
    throw new ApiError(
      500,
      "admin_not_configured",
      "Set ADMIN_PASSWORD in the server environment to use /admin.",
    );
  }

  if (!isCorrectPassword(password)) {
    throw new ApiError(401, "invalid_password", "Incorrect password.");
  }

  await createAdminSession();
  return { ok: true };
});
