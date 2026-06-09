// Client-safe constant for UI gating. The database independently enforces this
// via the public.super_admin_email() function used in RLS policies.
export const SUPER_ADMIN_EMAIL = (
  import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? "bernieamponsah12@gmail.com"
).toLowerCase();

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL;
}
