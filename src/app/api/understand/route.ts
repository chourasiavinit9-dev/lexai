import 'server-only';
import { makeRouteHandler } from '@/lib/route-factory';
import { UnderstandInputSchema, UnderstandOutputSchema } from '@/lib/validators';
import { geminiUnderstand } from '@/lib/gemini';

export const POST = makeRouteHandler({
  schema: UnderstandInputSchema,
  prefix: 'understand',
  handler: geminiUnderstand,
  outputSchema: UnderstandOutputSchema,
});
