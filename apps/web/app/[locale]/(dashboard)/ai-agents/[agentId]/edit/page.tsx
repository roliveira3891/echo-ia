import { AIAgentConfigureView } from "@/modules/ai-agents/ui/views/ai-agent-configure-view";

export default function AIAgentEditPage() {
  // Uses the same configure view - will detect agentId from URL params
  return <AIAgentConfigureView />;
}
