import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/paypal';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Use getToken instead of auth() - works reliably in API routes
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized - please sign in again' }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const PLAN_IDS: Record<string, string> = {
      pro: process.env.PAYPAL_PLAN_ID_PRO || '',
      business: process.env.PAYPAL_PLAN_ID_BUSINESS || '',
    };
    const planId = PLAN_IDS[plan];
    if (!planId) {
      return NextResponse.json({ error: 'Plan not configured' }, { status: 503 });
    }

    const baseUrl = 'https://ai-image-background-remover.site';
    const subscription = await createSubscription(
      planId,
      `${baseUrl}/api/paypal/success?plan=${plan}`,
      `${baseUrl}/dashboard?cancelled=true`
    );

    const approvalUrl = subscription.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve'
    )?.href;

    if (!approvalUrl) {
      return NextResponse.json({
        error: 'PayPal error: ' + (subscription.message || subscription.name || 'no approval URL'),
      }, { status: 500 });
    }

    return NextResponse.json({ url: approvalUrl });
  } catch (error) {
    console.error('PayPal subscribe error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
