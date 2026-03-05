import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || !url.startsWith('https://maps.googleapis.com/')) {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/png',
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        return new NextResponse('Failed to fetch image', { status: 500 });
    }
}
