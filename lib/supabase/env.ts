export type SupabaseEnv = {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
};

const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0);

export const getSupabaseEnv = (): SupabaseEnv => {
  const url = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL
  );
  const anonKey = firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY
  );
  const serviceRoleKey = firstNonEmpty(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_KEY
  );

  return { url, anonKey, serviceRoleKey };
};

export const assertSupabaseEnv = (
  required: Array<keyof SupabaseEnv>
): Required<Pick<SupabaseEnv, (typeof required)[number]>> => {
  const env = getSupabaseEnv();
  const missing = required.filter((key) => !env[key]);

  if (missing.length) {
    const nameMap: Record<keyof SupabaseEnv, string[]> = {
      url: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
      anonKey: ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"],
      serviceRoleKey: ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"]
    };
    const expected = missing
      .flatMap((key) => nameMap[key])
      .map((name) => `- ${name}`)
      .join("\n");

    throw new Error(
      `Missing Supabase environment variables.\nExpected one of:\n${expected}`
    );
  }

  return env as any;
};

