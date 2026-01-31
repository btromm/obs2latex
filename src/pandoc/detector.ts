// src/pandoc/detector.ts
import { execSync } from 'child_process';

export function isPandocAvailable(pandocPath: string): boolean {
  try {
    execSync(`"${pandocPath}" --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function findPandoc(customPath: string): string | null {
  if (customPath && isPandocAvailable(customPath)) {
    return customPath;
  }

  if (isPandocAvailable('pandoc')) {
    return 'pandoc';
  }

  const commonPaths = [
    '/usr/local/bin/pandoc',
    '/opt/homebrew/bin/pandoc',
    '/usr/bin/pandoc',
  ];

  for (const path of commonPaths) {
    if (isPandocAvailable(path)) {
      return path;
    }
  }

  return null;
}

export function getPandocVersion(pandocPath: string): string | null {
  try {
    const output = execSync(`"${pandocPath}" --version`, { stdio: 'pipe' });
    const firstLine = output.toString().split('\n')[0] ?? '';
    return firstLine.trim();
  } catch {
    return null;
  }
}
