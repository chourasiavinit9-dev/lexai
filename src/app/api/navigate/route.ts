import 'server-only';
import { makeRouteHandler } from '@/lib/route-factory';
import { NavigateInputSchema, NavigateOutputSchema } from '@/lib/validators';
import { geminiNavigate } from '@/lib/gemini';

export const POST = makeRouteHandler({
  schema: NavigateInputSchema,
  prefix: 'navigate',
  handler: geminiNavigate,
  outputSchema: NavigateOutputSchema,
});
