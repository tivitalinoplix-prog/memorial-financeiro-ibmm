import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // N8N webhook URL from the original component
    const n8nWebhookUrl = 'https://vitalino.app.n8n.cloud/webhook/comprovantes-2026'
    
    // Forward the request to n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N error response:', response.status, errorText);
      return NextResponse.json(
        { error: 'Falha ao processar a imagem no n8n' },
        { status: response.status }
      );
    }

    // Usually n8n returns 200 OK
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error forwarding to n8n:', error);
    return NextResponse.json(
      { error: 'Internal server error while uploading to n8n' },
      { status: 500 }
    );
  }
}
