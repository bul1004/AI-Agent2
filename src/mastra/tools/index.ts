import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import { withLog } from "@/lib/server/logging/logwrap";

let tavilyClient: ReturnType<typeof tavily> | null = null;
const logger = createLogger("mastra.tavily");

const getTavilyClient = () => {
  if (!tavilyClient) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY environment variable is not set");
    }
    tavilyClient = tavily({ apiKey });
  }
  return tavilyClient;
};

const tavilyExtractInputSchema = z.object({
  urls: z
    .array(z.string().url())
    .max(5)
    .describe("List of URLs to extract content from (max 20)"),
});

type TavilyExtractContext = z.infer<typeof tavilyExtractInputSchema>;

const tavilyExtractImpl = async (
  context: TavilyExtractContext
): Promise<{
  results: { url: string; content: string }[];
  failedResults: unknown[];
}> => {
  const { urls } = context;
  const tvly = getTavilyClient();
  const response = await tvly.extract(urls, { extractDepth: "advanced" });

  return {
    results: response.results.map((result) => ({
      url: result.url,
      content: result.rawContent || "",
    })),
    failedResults: response.failedResults || [],
  };
};

const tavilyExtractWithLog = withLog(tavilyExtractImpl, {
  name: "mastra.tavily.extract",
  pickArgs: ([context]) => ({ urlCount: context.urls.length }),
  sampleInfoRate: 0,
});

export const tavilyExtract = createTool({
  id: "Tavily Extract",
  description:
    "Extract content from a list of URLs using Tavily's extraction API.",
  inputSchema: tavilyExtractInputSchema,
  execute: async ({ context }) => {
    try {
      return await tavilyExtractWithLog(context);
    } catch (error: unknown) {
      logger.error("Tavily extract error", {
        name: "mastra.tavily.extract",
        args: { urlCount: context.urls.length },
        err: serializeError(error),
      });
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract content with Tavily: ${errorMessage}`);
    }
  },
});

const tavilySearchInputSchema = z.object({
  query: z.string().describe("The search query"),
  searchDepth: z
    .enum(["basic", "advanced"])
    .optional()
    .describe(
      "The depth of the search. 'basic' is faster, 'advanced' is more thorough."
    ),
  maxResults: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .describe("Maximum number of results to return (1-20)."),
  includeAnswer: z
    .boolean()
    .optional()
    .describe(
      "Whether to include an AI-generated answer based on the search results."
    ),
  topic: z
    .enum(["general", "news"])
    .optional()
    .describe("The category of search to perform."),
  timeRange: z
    .enum(["day", "week", "month", "year"])
    .optional()
    .describe("Filter results by time range."),
});

type TavilySearchContext = z.infer<typeof tavilySearchInputSchema>;

const tavilySearchImpl = async (context: TavilySearchContext) => {
  const {
    query,
    searchDepth = "basic",
    maxResults = 5,
    includeAnswer = false,
    topic = "general",
    timeRange,
  } = context;

  const tvly = getTavilyClient();
  const response = await tvly.search(query, {
    searchDepth,
    maxResults,
    includeAnswer,
    topic,
    ...(timeRange && { timeRange }),
  });

  return {
    results: response.results,
    query: response.query,
    responseTime: response.responseTime,
    answer: response.answer,
  };
};

const tavilySearchWithLog = withLog(tavilySearchImpl, {
  name: "mastra.tavily.search",
  pickArgs: ([context]) => ({
    queryLen: context.query.length,
    searchDepth: context.searchDepth ?? "basic",
    maxResults: context.maxResults ?? 5,
    includeAnswer: context.includeAnswer ?? false,
    topic: context.topic ?? "general",
    timeRange: context.timeRange ?? "none",
  }),
  sampleInfoRate: 0,
});

export const tavilySearch = createTool({
  id: "Tavily Search",
  description:
    "Search the web for information using Tavily's AI-optimized search engine.",
  inputSchema: tavilySearchInputSchema,
  execute: async ({ context }) => {
    try {
      return await tavilySearchWithLog(context);
    } catch (error: unknown) {
      const {
        query,
        searchDepth = "basic",
        maxResults = 5,
        includeAnswer = false,
        topic = "general",
        timeRange,
      } = context;
      logger.error("Tavily search error", {
        name: "mastra.tavily.search",
        args: {
          queryLen: query.length,
          searchDepth,
          maxResults,
          includeAnswer,
          topic,
          timeRange: timeRange ?? "none",
        },
        err: serializeError(error),
      });
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to search with Tavily: ${errorMessage}`);
    }
  },
});
