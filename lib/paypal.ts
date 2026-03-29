// PayPal API helpers

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get access token
async function getPayPalToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal token');
  return data.access_token;
}

// Create subscription plan (call once to set up)
export async function createPayPalPlan(planKey: 'pro' | 'business') {
  const token = await getPayPalToken();

  const prices: Record<string, string> = { pro: '9.00', business: '29.00' };
  const names: Record<string, string> = { pro: 'Pro Plan', business: 'Business Plan' };
  const quotas: Record<string, number> = { pro: 100, business: 500 };

  // Create product first
  const productRes = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: `Background Remover ${names[planKey]}`,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });
  const product = await productRes.json();

  // Create billing plan
  const planRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      product_id: product.id,
      name: names[planKey],
      description: `${quotas[planKey]} images per month`,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: prices[planKey], currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'USD' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });
  return await planRes.json();
}

// Create subscription for a user
export async function createSubscription(planId: string, returnUrl: string, cancelUrl: string) {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: 'Background Remover',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });
  return await res.json();
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return await res.json();
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string, reason = 'User requested cancellation') {
  const token = await getPayPalToken();
  await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
}
