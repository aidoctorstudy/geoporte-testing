import { handle } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";

export const POST = handle(async () => {
  await clearAdminSession();
  return { ok: true };
});
