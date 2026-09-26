import 'server-only';
import { makeRouteHandler } from '@/lib/route-factory';
import { CompareInputSchema, CompareOutputSchema } from '@/lib/validators';
import { geminiCompare } from '@/lib/gemini';

export const POST = makeRouteHandler({
  schema: CompareInputSchema,
  prefix: 'compare',
  handler: geminiCompare,
  outputSchema: CompareOutputSchema,
});
