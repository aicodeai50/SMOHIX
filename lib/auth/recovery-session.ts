/** Bound the reset-link check, including provider failures and stalled requests. */
export async function resolveRecoverySession(check: () => Promise<boolean>, timeoutMs = 10_000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([check(), new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); })]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
