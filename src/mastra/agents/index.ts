import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";

export const assistant = new Agent({
  name: "Assistant",
  instructions: "You are a helpful assistant.",
  model: anthropic("claude-sonnet-4-5-20250929"),
});
