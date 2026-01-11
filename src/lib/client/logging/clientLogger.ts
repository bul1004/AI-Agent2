"use client";

import type { Logger } from "next-axiom";

/**
 * withClientLog のオプション
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ClientLogOptions<T extends (...args: any[]) => any> {
  /** 関数の識別子（"client.domain.function" 形式を推奨） */
  name: string;
  /** 引数を要約する関数（ログに記録する情報を抽出） */
  pickArgs?: (args: Parameters<T>) => Record<string, unknown>;
  /** 成功時のログ記録確率（0-1、デフォルト: 0 = エラーのみ） */
  sampleInfoRate?: number;
}

const ERROR_FLAG_KEY = "_CLIENT_ERR_LOGGED";

/**
 * エラーを安全にシリアライズ（クライアント用）
 *
 * @param error - エラーオブジェクト
 * @returns シリアライズされたエラー情報
 */
export function serializeClientError(error: unknown): {
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
export function markClientErrorAsLogged(error: unknown): void {
  if (error && typeof error === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any)[ERROR_FLAG_KEY] = true;
  }
}

/**
 * エラーが既にログ記録済みかチェック
 *
 * @param error - エラーオブジェクト
 * @returns ログ記録済みなら true
 */
export function isClientErrorLogged(error: unknown): boolean {
  if (error && typeof error === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (error as any)[ERROR_FLAG_KEY] === true;
  }
  return false;
}

function getDurationMs(start: number): number {
  const end =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  return Math.max(0, Math.round(end - start));
}

/**
 * 非同期関数をクライアント用ログラッパーで包む
 *
 * @param logger - next-axiom Logger
 * @param fn - ラップする関数
 * @param options - ログオプション
 * @returns ラップされた関数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withClientLog<T extends (...args: any[]) => Promise<any>>(
  logger: Logger,
  fn: T,
  options: ClientLogOptions<T>
): T {
  const { name, pickArgs, sampleInfoRate = 0 } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const argsSummary =
      pickArgs !== undefined ? pickArgs(args as Parameters<T>) : undefined;

    try {
      const result = await fn(...args);

      if (sampleInfoRate > 0 && Math.random() < sampleInfoRate) {
        logger.info(`${name} completed`, {
          name,
          args:
            argsSummary === undefined
              ? { ms: getDurationMs(start) }
              : { ms: getDurationMs(start), ...argsSummary },
        });
      }

      return result;
    } catch (error) {
      if (!isClientErrorLogged(error)) {
        logger.error(`${name} failed`, {
          name,
          args:
            argsSummary === undefined
              ? { ms: getDurationMs(start) }
              : { ms: getDurationMs(start), ...argsSummary },
          err: serializeClientError(error),
        });
        markClientErrorAsLogged(error);
      }
      throw error;
    }
  }) as T;
}

/**
 * 同期関数をクライアント用ログラッパーで包む
 *
 * @param logger - next-axiom Logger
 * @param fn - ラップする同期関数
 * @param options - ログオプション
 * @returns ラップされた関数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withClientLogSync<T extends (...args: any[]) => any>(
  logger: Logger,
  fn: T,
  options: ClientLogOptions<T>
): T {
  const { name, pickArgs } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const argsSummary =
      pickArgs !== undefined ? pickArgs(args as Parameters<T>) : undefined;

    try {
      return fn(...args);
    } catch (error) {
      if (!isClientErrorLogged(error)) {
        logger.error(`${name} failed`, {
          name,
          args:
            argsSummary === undefined
              ? { ms: getDurationMs(start) }
              : { ms: getDurationMs(start), ...argsSummary },
          err: serializeClientError(error),
        });
        markClientErrorAsLogged(error);
      }
      throw error;
    }
  }) as T;
}
