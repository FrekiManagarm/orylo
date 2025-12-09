import { Logger } from "tslog";

export const logger = new Logger({
  hideLogPositionForProduction: true,
  type: "pretty",
});

export function logWebhook(event: string, clientId: string, data: any) {
  logger.info({
    type: "webhook",
    event,
    clientId,
    ...data,
  });
}

export function logFraudAnalysis(
  paymentIntentId: string,
  score: number,
  recommendation: string,
  processingTimeMs: number,
) {
  logger.info({
    type: "fraud_analysis",
    paymentIntentId,
    score,
    recommendation,
    processingTimeMs,
  });
}

export function logError(context: string, error: Error, metadata?: any) {
  logger.error({
    type: "error",
    context,
    error: error.message,
    stack: error.stack,
    ...metadata,
  });
}
