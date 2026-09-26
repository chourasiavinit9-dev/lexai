import type { RuiBoState } from "@/components/RuiBoAssistant";

export function getRuiBoState(input: {
  isTyping?: boolean;
  isLoading?: boolean;
  isStreaming?: boolean;
  hasError?: boolean;
  completed?: boolean;
  needsClarification?: boolean;
  isDocumentAnalysis?: boolean;
}): RuiBoState {
  if (input.hasError) return "error";
  if (input.needsClarification) return "clarifying";
  if (input.completed) return "success";
  if (input.isDocumentAnalysis && input.isLoading) return "analysing";
  if (input.isLoading) return "thinking";
  if (input.isStreaming) return "responding";
  if (input.isTyping) return "listening";
  return "idle";
}
