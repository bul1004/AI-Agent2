import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Stripe Checkout ページの Page Object
 *
 * 注意: Stripeの外部ページを操作するため、UIが変更される可能性があります。
 * テスト失敗時はセレクターの更新が必要な場合があります。
 */
export class StripeCheckoutPage {
  readonly page: Page;

  // フォーム要素
  readonly emailInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cardCvcInput: Locator;
  readonly cardholderNameInput: Locator;
  readonly submitButton: Locator;

  // テストカード情報
  static readonly TEST_CARD = {
    number: "4242424242424242",
    expiry: "12/30",
    cvc: "123",
    name: "Test User",
  };

  static readonly DECLINED_CARD = {
    number: "4000000000000002",
    expiry: "12/30",
    cvc: "123",
    name: "Test User",
  };

  constructor(page: Page) {
    this.page = page;

    // Stripe Checkout のセレクター（2024年12月時点）
    // iframeの中にあるため、frameLocatorを使用
    this.emailInput = page.locator('input[name="email"]');
    this.cardNumberInput = page.locator('input[name="cardNumber"]');
    this.cardExpiryInput = page.locator('input[name="cardExpiry"]');
    this.cardCvcInput = page.locator('input[name="cardCvc"]');
    this.cardholderNameInput = page.locator('input[name="billingName"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  /**
   * Stripeチェックアウトページにいることを確認
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/checkout\.stripe\.com/, {
      timeout: 30000,
    });
    // ページ読み込み完了を待つ
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * メールアドレスを入力
   */
  async fillEmail(email: string) {
    // メール入力欄が表示されている場合のみ入力
    const emailVisible = await this.emailInput.isVisible().catch(() => false);
    if (emailVisible) {
      await this.emailInput.fill(email);
    }
  }

  /**
   * カード情報を入力（テストカード）
   */
  async fillCardDetails(card = StripeCheckoutPage.TEST_CARD) {
    // Stripeの新しいUIでは、カード情報がiframe内にある場合がある
    // まずはdirect inputを試す
    try {
      // カード番号
      const cardFrame = this.page
        .frameLocator('iframe[name*="__privateStripeFrame"]')
        .first();
      const cardInput = cardFrame.locator('input[name="cardnumber"]');

      if (await cardInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // iframe内のフォーム
        await cardInput.fill(card.number);
        await cardFrame.locator('input[name="exp-date"]').fill(card.expiry);
        await cardFrame.locator('input[name="cvc"]').fill(card.cvc);
      } else {
        // 直接フォーム（新しいStripe Checkout）
        await this.fillDirectCardForm(card);
      }
    } catch {
      // フォールバック: 直接フォーム
      await this.fillDirectCardForm(card);
    }
  }

  /**
   * 直接フォームにカード情報を入力
   */
  private async fillDirectCardForm(card: typeof StripeCheckoutPage.TEST_CARD) {
    // カード番号入力
    // Stripeは複数の入力形式がある
    const cardNumberSelectors = [
      'input[name="cardNumber"]',
      'input[data-elements-stable-field-name="cardNumber"]',
      'input[placeholder*="1234"]',
      "#cardNumber",
    ];

    for (const selector of cardNumberSelectors) {
      const input = this.page.locator(selector);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.fill(card.number);
        break;
      }
    }

    // 有効期限
    const expirySelectors = [
      'input[name="cardExpiry"]',
      'input[data-elements-stable-field-name="cardExpiry"]',
      'input[placeholder*="MM"]',
      "#cardExpiry",
    ];

    for (const selector of expirySelectors) {
      const input = this.page.locator(selector);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.fill(card.expiry);
        break;
      }
    }

    // CVC
    const cvcSelectors = [
      'input[name="cardCvc"]',
      'input[data-elements-stable-field-name="cardCvc"]',
      'input[placeholder*="CVC"]',
      "#cardCvc",
    ];

    for (const selector of cvcSelectors) {
      const input = this.page.locator(selector);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.fill(card.cvc);
        break;
      }
    }

    // カード名義（表示されている場合）
    const nameSelectors = [
      'input[name="billingName"]',
      'input[data-elements-stable-field-name="billingName"]',
      'input[placeholder*="name"]',
    ];

    for (const selector of nameSelectors) {
      const input = this.page.locator(selector);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        await input.fill(card.name);
        break;
      }
    }
  }

  /**
   * 支払いを送信
   */
  async submit() {
    // 送信ボタンを探す
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Pay")',
      'button:has-text("Subscribe")',
      'button:has-text("支払う")',
      'button:has-text("申し込む")',
      ".SubmitButton",
    ];

    for (const selector of submitSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await button.click();
        return;
      }
    }

    throw new Error("送信ボタンが見つかりません");
  }

  /**
   * テストカードで支払いを完了
   */
  async completePaymentWithTestCard(email?: string) {
    await this.expectLoaded();

    if (email) {
      await this.fillEmail(email);
    }

    await this.fillCardDetails();
    await this.submit();

    // 支払い処理完了を待つ（リダイレクトまたはエラー表示）
    await this.page.waitForURL(
      (url) => !url.href.includes("checkout.stripe.com"),
      { timeout: 60000 },
    );
  }

  /**
   * 支払い成功後にアプリにリダイレクトされることを確認
   */
  async expectSuccessRedirect(baseUrl: string) {
    await expect(this.page).toHaveURL(new RegExp(`${baseUrl}.*success=true`), {
      timeout: 30000,
    });
  }

  /**
   * 支払い失敗（カード拒否）を確認
   */
  async expectPaymentDeclined() {
    // エラーメッセージが表示されることを確認
    const errorSelectors = [
      "text=Your card was declined",
      "text=カードが拒否されました",
      ".StripeError",
      '[data-testid="error-message"]',
    ];

    for (const selector of errorSelectors) {
      const error = this.page.locator(selector);
      if (await error.isVisible({ timeout: 10000 }).catch(() => false)) {
        return;
      }
    }

    throw new Error("支払い拒否エラーが表示されません");
  }
}
