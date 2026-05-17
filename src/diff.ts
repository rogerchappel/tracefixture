export function formatDiff(expected: string, actual: string): string {
  if (expected === actual) {
    return '';
  }

  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const max = Math.max(expectedLines.length, actualLines.length);
  const lines: string[] = [];

  for (let index = 0; index < max; index += 1) {
    const left = expectedLines[index];
    const right = actualLines[index];
    if (left === right) {
      continue;
    }

    if (left !== undefined) {
      lines.push(`- ${left}`);
    }
    if (right !== undefined) {
      lines.push(`+ ${right}`);
    }

    if (lines.length >= 20) {
      lines.push('... diff truncated ...');
      break;
    }
  }

  return lines.join('\n');
}
