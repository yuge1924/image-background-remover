import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasPlanIdPro: !!process.env.PAYPAL_PLAN_ID_PRO,
    hasPlanIdBusiness: !!process.env.PAYPAL_PLAN_ID_BUSINESS,
    hasClientId: !!process.env.PAYPAL_CLIENT_ID,
    hasSecret: !!process.env.PAYPAL_SECRET,
    mode: process.env.PAYPAL_MODE,
    planIdProPrefix: process.env.PAYPAL_PLAN_ID_PRO?.substring(0, 8),
  });
}
