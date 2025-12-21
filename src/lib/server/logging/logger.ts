/**
 * lib/server/logging/logger.ts
 *
 * ロギング共通ユーティリティ
 * logging-rules.md に準拠
 */

import { Logger } from "next-axiom";

/**
 * Axiom Logger を作成
 *
 * @param source - ログのソース識別子（例: "api", "actions/documents"）
 * @returns Logger インスタンス
 */
export function createLogger(source: string): Logger {
  return new Logger({ source });
}

/**
 * エラーを安全にシリアライズ
 * stack trace も含めて構造化データに変換
 *
 * @param error - エラーオブジェクト
 * @returns シリアライズされたエラー情報
 */
export function serializeError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    stack: undefined,
  };
}

/**
 * エラーに二重ログ防止フラグを付与
 *
 * @param error - エラーオブジェクト
 */
export function markErrorAsLogged(error: unknown): void {
  if (error && typeof error === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any)._ERR_LOGGED = true;
  }
}

/**
 * エラーが既にログ記録済みかチェック
 *
 * @param error - エラーオブジェクト
 * @returns ログ記録済みなら true
 */
export function isErrorLogged(error: unknown): boolean {
  if (error && typeof error === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (error as any)._ERR_LOGGED === true;
  }
  return false;
}

/**
 * Logger.flush() を安全に実行するユーティリティ。
 *
 * ネットワーク遅延などで flush が完了しない場合でも、Timeout 後に呼び出し元へ制御を戻す。
 * Webhook や API のレスポンス遅延を防ぐための保険。
 *
 * @param logger - flush の対象となる Logger インスタンス
 * @param timeoutMs - タイムアウト（ミリ秒）。デフォルト 2000ms
 */
export async function flushLoggerSafely(
  logger: Logger,
  timeoutMs = 2000
): Promise<void> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      logger.flush(),
      new Promise<void>((resolve) => {
        timeoutHandle = setTimeout(resolve, timeoutMs);
        if (typeof timeoutHandle?.unref === "function") {
          timeoutHandle.unref();
        }
      }),
    ]);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Logger flush failed", serializeError(error));
    }
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * 引数要約ヘルパー
 * logging-rules.md の「引数の要約方針」に基づく
 */

/**
 * 文字列を要約（長さ + プレビュー）
 *
 * @param text - 文字列
 * @param previewLength - プレビューの長さ（デフォルト: 50）
 * @returns 要約情報
 */
export function summarizeString(
  text: string,
  previewLength = 50
): { textLen: number; preview: string } {
  return {
    textLen: text.length,
    preview: text.slice(0, previewLength),
  };
}

/**
 * Buffer をバイト数に要約
 *
 * @param buffer - Buffer
 * @returns バイト数情報
 */
export function summarizeBuffer(buffer: Buffer): {
  bytes: number;
  type: "Buffer";
} {
  return {
    bytes: buffer.length,
    type: "Buffer",
  };
}

/**
 * 配列を件数に要約
 *
 * @param items - 配列
 * @returns 件数情報
 */
export function summarizeArray<T>(items: T[]): { itemCount: number } {
  return {
    itemCount: items.length,
  };
}

/**
 * オブジェクトのキーのみを取得（値は含めない）
 *
 * @param obj - オブジェクト
 * @param limit - 取得するキーの最大数（デフォルト: 10）
 * @returns キー一覧
 */
export function summarizeObjectKeys(
  obj: Record<string, unknown>,
  limit = 10
): { keys: string[] } {
  return {
    keys: Object.keys(obj).slice(0, limit),
  };
}
