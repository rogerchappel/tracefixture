export const NORMALIZERS = [
  'trim-trailing-space',
  'normalize-newlines',
  'collapse-duration-ms'
] as const;

export function normalizeOutput(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/durationMs":\s*\d+/g, 'durationMs": <DURATION_MS>');
}

export function normalizeCommandDisplay(argv: string[]): string {
  return argv.map(shellQuote).join(' ');
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}
