export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { data, meta: meta ?? {} }
}

export function err(code: string, message: string, meta?: Record<string, unknown>) {
  return { error: { code, message }, meta: meta ?? {} }
}
