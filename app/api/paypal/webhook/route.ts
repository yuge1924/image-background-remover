import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cancelSubscription } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    console.log('PayPal webhook:', event.event_type);

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = event.resource?.id;
        if (subscriptionId) {
          await supabaseAdmin.from('users').update({
            plan: 'free',
            paypal_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('paypal_subscription_id', subscriptionId);

          await supabaseAdmin.from('subscriptions').update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('paypal_subscription_id', subscriptionId);
        }
        break;
      }
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = event.resource?.id;
        if (subscriptionId) {
          await supabaseAdmin.from('subscriptions').update({
            status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('paypal_subscription_id', subscriptionId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
