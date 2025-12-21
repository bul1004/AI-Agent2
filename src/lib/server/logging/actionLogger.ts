/**
 * lib/server/logging/actionLogger.ts
 *
 * Server Action 専用のロギングヘルパー。
 * logging-rules.md に基づき、アクション単位での失敗/警告/情報ログを標準化する。
 */

import { createLogger, serializeError } from "@/lib/server/logging/logger";

type ActionLogLevel = "info" | "warn" | "error";

interface ActionLogFields extends Record<string, unknown> {
  ms?: number;
}

/**
 * 共通のロギングエントリーポイント。
 */
async function logActionEvent(
  actionName: string,
  level: ActionLogLevel,
  message: string,
  fields: ActionLogFields = {}
): Promise<void> {
  const logger = createLogger(actionName);
  logger[level](message, {
    name: actionName,
    ...fields,
  });
  await logger.flush();
}

/**
 * Server Action が失敗した際のログを記録。
 *
 * @param actionName - ログ識別子（例: actions.documents.getDocuments）
 * @param error - 例外オブジェクト
 * @param fields - 追加メタデータ（userId / orgId など）
 * @param message - 任意のカスタムメッセージ
 */
export async function logActionError(
  actionName: string,
  error: unknown,
  fields: ActionLogFields = {},
  message?: string
): Promise<void> {
  await logActionEvent(actionName, "error", message ?? `${actionName} failed`, {
    ...fields,
    err: serializeError(error),
  });
}

/**
 * 想定されるリカバリー可能な状況（バリデーション失敗など）向けの警告ログ。
 */
export async function logActionWarning(
  actionName: string,
  message: string,
  fields: ActionLogFields = {}
): Promise<void> {
  await logActionEvent(actionName, "warn", message, fields);
}

/**
 * 成功時や状態遷移を記録したい場合の情報ログ。
 */
export async function logActionInfo(
  actionName: string,
  message: string,
  fields: ActionLogFields = {}
): Promise<void> {
  await logActionEvent(actionName, "info", message, fields);
}
