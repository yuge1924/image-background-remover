import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: '不支持的文件格式，请上传 JPG、PNG 或 WEBP' }, { status: 400 });
    }

    // Validate file size (12MB)
    if (image.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小超过 12MB 限制' }, { status: 400 });
    }

    const apiKey = process.env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', image);
    removeBgFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API error:', response.status, errorText);

      if (response.status === 402) {
        return NextResponse.json({ error: 'API 额度已用完，请稍后再试' }, { status: 402 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
      }

      return NextResponse.json(
        { error: `处理失败 (${response.status})，请重试` },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="removed-bg.png"',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
}
