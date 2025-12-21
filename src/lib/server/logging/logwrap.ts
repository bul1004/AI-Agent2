/**
 * lib/server/logging/logwrap.ts
 *
 * 関数ラッピング用ロギングユーティリティ
 * logging-rules.md に準拠
 *
 * 機能:
 * - 実行時間の自動記録
 * - エラー時の引数とスタックトレースの自動記録
 * - 成功時のサンプリング可能
 * - 二重ログ防止
 *
 * 設計ポリシー:
 * - 元の関数のシグネチャを変更しない
 * - Logger は内部で自動生成（エラー時のみ）
 * - withAxiom() により Logger は自動 flush される
 */

import {
  createLogger,
  serializeError,
  markErrorAsLogged,
  isErrorLogged,
} from "@/lib/server/logging/logger";

/**
 * withLog のオプション
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WithLogOptions<T extends (...args: any[]) => any> {
  /** 関数の識別子（"domain.function" 形式） */
  name: string;
  /** 引数を要約する関数（ログに記録する情報を抽出） */
  pickArgs?: (args: Parameters<T>) => Record<string, unknown>;
  /** 成功時のログ記録確率（0-1、デフォルト: 0 = エラーのみ） */
  sampleInfoRate?: number;
}

/**
 * 非同期関数をログラッパーで包む
 *
 * - 元の関数のシグネチャを変更しない
 * - エラー時に Logger を自動生成して記録
 * - 成功時はサンプリング可能（デフォルト: 記録しない）
 * - 二重ログ防止機能付き
 *
 * @param fn - ラップする非同期関数
 * @param options - ログオプション
 * @returns ラップされた関数
 *
 * @example
 * const sendToSlack = withLog(
 *   async function sendToSlack(data: ContactFormData) {
 *     // ... 実装 ...
 *   },
 *   {
 *     name: 'slack.sendToSlack',
 *     pickArgs: ([data]) => ({ email: data.email })
 *   }
 * );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLog<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: WithLogOptions<T>
): T {
  const { name, pickArgs, sampleInfoRate = 0 } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);

      // 成功時のログ（サンプリング）
      if (Math.random() < sampleInfoRate) {
        const logger = createLogger(name);
        const summarizedArgs = pickArgs
          ? pickArgs(args as Parameters<T>)
          : undefined;
        logger.info(`${name} completed`, {
          name,
          args:
            summarizedArgs === undefined
              ? { ms: Date.now() - startTime }
              : { ms: Date.now() - startTime, ...summarizedArgs },
        });
        // flush は withAxiom() が自動で行う
      }

      return result;
    } catch (error) {
      // エラー時は必ずログ（二重ログ防止）
      if (!isErrorLogged(error)) {
        const logger = createLogger(name);
        const summarizedArgs = pickArgs
          ? pickArgs(args as Parameters<T>)
          : undefined;
        logger.error(`${name} failed`, {
          name,
          args:
            summarizedArgs === undefined
              ? { ms: Date.now() - startTime }
              : { ms: Date.now() - startTime, ...summarizedArgs },
          err: serializeError(error),
        });

        markErrorAsLogged(error);
        // flush は withAxiom() が自動で行う
      }

      // rethrow（スタック保持）
      throw error;
    }
  }) as T;
}

/**
 * 同期関数をログラッパーで包む
 *
 * - 元の関数のシグネチャを変更しない
 * - エラー時に Logger を自動生成して記録
 * - 成功時のログは記録しない（同期関数は高速なため）
 * - 二重ログ防止機能付き
 *
 * @param fn - ラップする同期関数
 * @param options - ログオプション
 * @returns ラップされた関数
 *
 * @example
 * const validateContactForm = withLogSync(
 *   function validateContactForm(data: unknown) {
 *     // ... 実装 ...
 *   },
 *   {
 *     name: 'slack.validateContactForm',
 *     pickArgs: ([data]) => ({ dataType: typeof data })
 *   }
 * );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLogSync<T extends (...args: any[]) => any>(
  fn: T,
  options: WithLogOptions<T>
): T {
  const { name, pickArgs } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    const startTime = Date.now();

    try {
      return fn(...args);
    } catch (error) {
      // エラー時のみログ（二重ログ防止）
      if (!isErrorLogged(error)) {
        const logger = createLogger(name);
        logger.error(`${name} failed`, {
          name,
          args:
            pickArgs === undefined
              ? { ms: Date.now() - startTime }
              : {
                  ms: Date.now() - startTime,
                  ...pickArgs(args as Parameters<T>),
                },
          err: serializeError(error),
        });

        markErrorAsLogged(error);
        // flush は withAxiom() が自動で行う
      }

      // rethrow（スタック保持）
      throw error;
    }
  }) as T;
}
