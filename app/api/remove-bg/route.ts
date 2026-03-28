import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreateUser, canProcess, recordUsage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Please sign in to process images', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Get or create user in DB
    const user = await getOrCreateUser(
      session.user.email,
      session.user.name ?? undefined,
      session.user.image ?? undefined
    );

    // Quota check
    const { allowed, used, limit } = await canProcess(user.id, user.plan);
    if (!allowed) {
      return NextResponse.json({
        error: `Monthly quota exceeded (${used}/${limit}). Please upgrade your plan.`,
        code: 'QUOTA_EXCEEDED',
        used,
        limit,
        plan: user.plan,
      }, { status: 429 });
    }

    // Validate image
    const formData = await request.formData();
    const image = formData.get('image') as File;
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Unsupported format. Please upload JPG, PNG or WEBP.' }, { status: 400 });
    }
    if (image.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 12MB limit.' }, { status: 400 });
    }

    // Call remove.bg
    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', image);
    removeBgFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: removeBgFormData,
    });

    if (!response.ok) {
      if (response.status === 402) return NextResponse.json({ error: 'API quota exhausted, please try later.' }, { status: 402 });
      if (response.status === 429) return NextResponse.json({ error: 'Too many requests, please try later.' }, { status: 429 });
      return NextResponse.json({ error: `Processing failed (${response.status})` }, { status: response.status });
    }

    // Record usage after success
    await recordUsage(user.id);

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="removed-bg.png"',
        'X-Usage-Used': String(used + 1),
        'X-Usage-Limit': String(limit),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
