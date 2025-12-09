import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { createFraudAnalyzer } from "./agents/fraud-analyzer";

// Create fraud analyzer agent with default OpenAI model
const fraudAnalyzer = createFraudAnalyzer({
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.3,
});

export const mastra = new Mastra({
  agents: {
    fraudAnalyzer,
  },
  workflows: {},
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: {
    default: { enabled: false },
  },
});

export { fraudAnalyzer };
