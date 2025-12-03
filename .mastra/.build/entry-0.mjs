import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';

"use strict";
const mastra = new Mastra({
  agents: {},
  workflows: {},
  storage: new LibSQLStore({
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  observability: {
    default: {
      enabled: false
    }
  }
});

export { mastra };
