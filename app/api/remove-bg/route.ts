import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: missing API key' }, { status: 500 });
    }

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API Error Response:', errorText);
      
      // 如果是余额不足，给用户一个更友好的提示，而不是直接报 500
      if (response.status === 402 || errorText.includes('insufficient_credits')) {
        return NextResponse.json({ 
          error: 'API credit limit reached. Please contact the administrator to recharge.' 
        }, { status: 402 });
      }
      
      return NextResponse.json({ error: `Remove.bg API Error: ${errorText}` }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error: any) {
    console.error('Remove-bg API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
