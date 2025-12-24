/**
 * Resend API テストスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/test-resend.ts your-email@example.com
 *
 * 環境変数:
 *   RESEND_API_KEY - Resend APIキー
 *   RESEND_FROM_EMAIL - 送信元メールアドレス（Resendで検証済みのドメイン）
 */

import { loadEnvConfig } from "@next/env";

// Load environment variables
loadEnvConfig(process.cwd());

import { Resend } from "resend";

async function main() {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    console.error("使用方法: npx tsx scripts/test-resend.ts your-email@example.com");
    process.exit(1);
  }

  console.log("=== Resend API テスト ===\n");

  // 環境変数チェック
  console.log("環境変数チェック:");
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✓ 設定済み" : "✗ 未設定"}`);
  console.log(`  RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || "未設定 (noreply@example.com を使用)"}`);
  console.log(`  NEXT_PUBLIC_APP_NAME: ${process.env.NEXT_PUBLIC_APP_NAME || "AI Agent"}`);
  console.log("");

  if (!process.env.RESEND_API_KEY) {
    console.error("エラー: RESEND_API_KEY が設定されていません");
    console.error("  .env.local に RESEND_API_KEY=re_xxxx を追加してください");
    process.exit(1);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "AI Agent";

  console.log(`送信先: ${targetEmail}`);
  console.log(`送信元: ${appName} <${fromEmail}>`);
  console.log("");

  try {
    console.log("メール送信中...");

    const { data, error } = await resend.emails.send({
      from: `${appName} <${fromEmail}>`,
      to: targetEmail,
      subject: `[テスト] ${appName} からのテストメール`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #000;">Resend API テスト成功</h1>
          <p>このメールはResend APIのテストとして送信されました。</p>
          <p style="color: #666; font-size: 12px;">送信日時: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Resend API テスト成功\n\nこのメールはResend APIのテストとして送信されました。\n\n送信日時: ${new Date().toISOString()}`,
    });

    if (error) {
      console.error("\n✗ メール送信エラー:");
      console.error(`  名前: ${error.name}`);
      console.error(`  メッセージ: ${error.message}`);
      process.exit(1);
    }

    console.log("\n✓ メール送信成功!");
    console.log(`  メールID: ${data?.id}`);
    console.log("\n受信トレイを確認してください（迷惑メールフォルダも確認）");
  } catch (err) {
    console.error("\n✗ 例外発生:");
    console.error(err);
    process.exit(1);
  }
}

main();
