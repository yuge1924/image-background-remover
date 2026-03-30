import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/paypal';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { plan, email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Verify user exists in database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      `${baseUrl}/api/paypal/success?plan=${plan}&email=${encodeURIComponent(email)}`,
      `${baseUrl}/dashboard?cancelled=true`
    );

    const approvalUrl = subscription.links?.find(
      (l: { rel: string; href: string }) => l.rel === 'approve'
    )?.href;

    if (!approvalUrl) {
      return NextResponse.json({
        error: 'PayPal error: ' + (subscription.message || 'no approval URL'),
      }, { status: 500 });
    }

    return NextResponse.json({ url: approvalUrl });
  } catch (error) {
    console.error('PayPal subscribe error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
