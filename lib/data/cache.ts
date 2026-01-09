"use client";

import useSWR, { mutate, type SWRConfiguration } from "swr";

export type CacheTag =
  | "employees"
  | "attendance"
  | "salaries"
  | "salary-receipts"
  | "employee-documents"
  | "app-users"
  | "profile";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface ApiResponse<T> {
  data?: T;
  count?: number;
  total?: number;
  error?: string;
}

const hasValue = (value: QueryValue) =>
  value !== undefined && value !== null && value !== "";

export const buildQuery = (params?: QueryParams) => {
  if (!params) {
    return "";
  }

  const entries = Object.entries(params).filter(([, value]) => hasValue(value));
  if (!entries.length) {
    return "";
  }

  entries.sort(([a], [b]) => a.localeCompare(b));
  const search = new URLSearchParams();
  entries.forEach(([key, value]) => {
    search.set(key, String(value));
  });

  return search.toString();
};

export const buildApiUrl = (endpoint: string, params?: QueryParams) => {
  const query = buildQuery(params);
  return query ? `${endpoint}?${query}` : endpoint;
};

export const cacheKey = (tag: CacheTag, id: string) => `${tag}:${id}`;

export const buildApiKey = (tag: CacheTag, endpoint: string, params?: QueryParams) =>
  cacheKey(tag, buildApiUrl(endpoint, params));

const parseJson = async <T,>(response: Response): Promise<T | null> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await parseJson<T>(response);

  if (!response.ok) {
    const errorMessage =
      payload && typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error?: string }).error
        : "Error al procesar la solicitud";
    throw new Error(errorMessage);
  }

  return (payload ?? ({} as T));
}

export function useApiQuery<T>(
  tag: CacheTag,
  endpoint: string,
  params?: QueryParams,
  options?: SWRConfiguration<ApiResponse<T>>
) {
  const url = buildApiUrl(endpoint, params);
  const key = cacheKey(tag, url);
  const { data, error, isLoading, mutate: mutateKey } = useSWR<ApiResponse<T>>(
    key,
    () => apiFetch<ApiResponse<T>>(url),
    { keepPreviousData: true, ...options }
  );

  return {
    data: data?.data,
    count: data?.count ?? data?.total ?? 0,
    error,
    isLoading,
    mutate: mutateKey
  };
}

export function invalidateTag(tag: CacheTag) {
  return mutate((key) => typeof key === "string" && key.startsWith(`${tag}:`));
}

export interface ApiMutationOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
}

export async function apiMutation<T>(
  url: string,
  options: ApiMutationOptions,
  tags: CacheTag[] = []
) {
  const hasBody = options.body !== undefined;
  const headers = hasBody
    ? { "Content-Type": "application/json", ...(options.headers ?? {}) }
    : options.headers;

  const payload = await apiFetch<T>(url, {
    method: options.method ?? "POST",
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined
  });

  if (tags.length) {
    await Promise.all(tags.map((tag) => invalidateTag(tag)));
  }

  return payload;
}
