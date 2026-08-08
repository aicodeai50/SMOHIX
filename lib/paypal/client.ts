import {
  getPayPalApiBase,
  getPayPalClientId,
  getPayPalClientSecret,
  isPayPalConfigured,
} from "./config";

type AccessTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal credentials not configured");
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const clientId = getPayPalClientId()!;
  const clientSecret = getPayPalClientSecret()!;
  const base = getPayPalApiBase();

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as AccessTokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function paypalFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getPayPalAccessToken();
  const base = getPayPalApiBase();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PayPal API ${path}: ${res.status} ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type CreateOrderInput = {
  amountCents: number;
  currency?: string;
  description: string;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
};

export type PayPalOrderResponse = {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
};

export async function createPayPalOrder(
  input: CreateOrderInput,
): Promise<PayPalOrderResponse> {
  const amount = (input.amountCents / 100).toFixed(2);
  return paypalFetch<PayPalOrderResponse>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: input.currency ?? "USD",
            value: amount,
          },
          description: input.description,
          custom_id: input.customId,
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        brand_name: "Smohix",
        user_action: "PAY_NOW",
      },
    }),
  });
}

export type CreateSubscriptionInput = {
  planId: string;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
};

export type PayPalSubscriptionResponse = {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
};

export async function createPayPalSubscription(
  input: CreateSubscriptionInput,
): Promise<PayPalSubscriptionResponse> {
  return paypalFetch<PayPalSubscriptionResponse>("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: input.planId,
      custom_id: input.customId,
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        brand_name: "Smohix",
        user_action: "SUBSCRIBE_NOW",
      },
    }),
  });
}

export function approvalUrlFromLinks(
  links: { href: string; rel: string }[],
): string | undefined {
  return links.find((l) => l.rel === "approve")?.href;
}

export async function capturePayPalOrder(orderId: string): Promise<unknown> {
  return paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
  });
}
