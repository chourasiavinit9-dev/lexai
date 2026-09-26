import 'server-only';
import { makeRouteHandler } from '@/lib/route-factory';
import { ChatInputSchema, ChatOutputSchema } from '@/lib/validators';
import { geminiChat } from '@/lib/gemini';

export const POST = makeRouteHandler({
  schema: ChatInputSchema,
  prefix: 'chat',
  handler: geminiChat,
  outputSchema: ChatOutputSchema,
});
