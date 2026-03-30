import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  // Test PayPal subscription creation directly
  const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com';
  let paypalTest: Record<string, unknown> = {};

  try {
    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await tokenRes.json();

    const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` },
      body: JSON.stringify({
        plan_id: process.env.PAYPAL_PLAN_ID_PRO,
        application_context: {
          brand_name: 'Background Remover',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: 'https://ai-image-background-remover.site/api/paypal/success?plan=pro',
          cancel_url: 'https://ai-image-background-remover.site/dashboard?cancelled=true',
        },
      }),
    });
    const subData = await subRes.json();
    const approvalUrl = subData.links?.find((l: {rel: string}) => l.rel === 'approve')?.href;
    paypalTest = { status: subData.status, approvalUrl, links: subData.links, error: subData.error };
  } catch (e) {
    paypalTest = { error: String(e) };
  }

  return NextResponse.json({
    sessionEmail: session?.user?.email || null,
    envVars: {
      hasPlanIdPro: !!process.env.PAYPAL_PLAN_ID_PRO,
      planIdPro: process.env.PAYPAL_PLAN_ID_PRO,
      hasClientId: !!process.env.PAYPAL_CLIENT_ID,
      hasSecret: !!process.env.PAYPAL_SECRET,
      mode: process.env.PAYPAL_MODE,
    },
    paypalTest,
  });
}
