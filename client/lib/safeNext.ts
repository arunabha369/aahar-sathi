/** Only same-site paths: a `?next=` link must never send someone to another website. */
export function safeNextPath(value: string | undefined | null): string | undefined {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return undefined;
  return value;
}
