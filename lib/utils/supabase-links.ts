export function getSupabaseProjectRef(supabaseUrl?: string | null) {
  if (!supabaseUrl) return null;
  const match = supabaseUrl.match(/^https?:\/\/([^\.]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export function getSupabaseDashboardUrl(supabaseUrl?: string | null) {
  const projectRef = getSupabaseProjectRef(supabaseUrl);
  if (!projectRef) return null;
  return `https://supabase.com/dashboard/project/${projectRef}/editor`;
}

export function getSupabaseAuthUsersUrl(supabaseUrl?: string | null) {
  const projectRef = getSupabaseProjectRef(supabaseUrl);
  if (!projectRef) return null;
  return `https://supabase.com/dashboard/project/${projectRef}/auth/users`;
}
