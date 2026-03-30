import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSubscription } from '@/lib/paypal';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const plan = searchParams.get('plan');

    if (!subscriptionId || !plan) {
      return NextResponse.redirect(new URL('/dashboard?error=missing_params', request.url));
    }

    // Verify with PayPal
    const subscription = await getSubscription(subscriptionId);
    if (subscription.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/dashboard?error=subscription_inactive', request.url));
    }

    // Update DB
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', token.email)
      .single();

    if (user) {
      await supabaseAdmin.from('users').update({
        plan,
        paypal_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: user.id,
        paypal_subscription_id: subscriptionId,
        plan,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'paypal_subscription_id' });
    }

    return NextResponse.redirect(new URL('/dashboard?upgraded=true', request.url));
  } catch (error) {
    console.error('PayPal success error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', request.url));
  }
}
