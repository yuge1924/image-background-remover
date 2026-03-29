import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createSubscription } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Read at runtime, not at module load time
    const PLAN_IDS: Record<string, string> = {
      pro: process.env.PAYPAL_PLAN_ID_PRO || '',
      business: process.env.PAYPAL_PLAN_ID_BUSINESS || '',
    };
    const planId = PLAN_IDS[plan];
    if (!planId) {
      return NextResponse.json({ error: 'Plan not configured yet' }, { status: 503 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://ai-image-background-remover.site';
    const subscription = await createSubscription(
      planId,
      `${baseUrl}/api/paypal/success?plan=${plan}`,
      `${baseUrl}/dashboard?cancelled=true`
    );

    const approvalUrl = subscription.links?.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href;
    if (!approvalUrl) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({ url: approvalUrl });
  } catch (error) {
    console.error('PayPal subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
