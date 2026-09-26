import 'server-only';
import { makeRouteHandler } from '@/lib/route-factory';
import { ClarifyInputSchema, ClarifyOutputSchema } from '@/lib/validators';
import { geminiClarify } from '@/lib/gemini';

export const POST = makeRouteHandler({
  schema: ClarifyInputSchema,
  prefix: 'clarify',
  handler: geminiClarify,
  outputSchema: ClarifyOutputSchema,
});
