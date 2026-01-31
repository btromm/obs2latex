// src/preprocessor/index.ts
import { processEquations } from './equations';
import { processCallouts } from './callouts';
import { processWikilinks } from './wikilinks';
import { resolveAllEmbeds } from './embeds';

export { extractEquationLabels, processEquations } from './equations';
export { processCallouts, CALLOUT_ENV_MAP } from './callouts';
export { parseWikilink, processWikilinks, WikilinkType } from './wikilinks';
export { extractBlockContent, resolveAllEmbeds } from './embeds';

/**
 * Full preprocessing pipeline
 * Order matters: embeds first (to pull in content), then process everything
 */
export async function preprocess(
  content: string,
  fileResolver: (path: string) => Promise<string | null>
): Promise<string> {
  // 1. Process wikilinks to placeholders (before embeds, so we don't process embed content twice)
  let result = processWikilinks(content);

  // 2. Resolve embeds (pulls in external content)
  result = await resolveAllEmbeds(result, fileResolver);

  // 3. Process callouts to LaTeX environments
  result = processCallouts(result);

  // 4. Process equations (labels, align detection)
  result = processEquations(result);

  return result;
}
