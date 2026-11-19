/** Quita las llaves con `undefined` para que `SET n += $cambios` solo toque lo enviado. */
export function soloDefinidos<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
