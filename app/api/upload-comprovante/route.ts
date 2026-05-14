import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Vercel has a default body size limit; increase it for images
export const maxDuration = 30; // seconds

export async function POST(request: Request) {
  const N8N_WEBHOOK_URL = 'https://vitalino.app.n8n.cloud/webhook/comprovantes-2026';

  try {
    const incomingFormData = await request.formData();
    const file = incomingFormData.get('comprovante');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo recebido no campo "comprovante"' },
        { status: 400 }
      );
    }

    // Rebuild a clean FormData to forward to n8n
    const outgoingFormData = new FormData();
    outgoingFormData.append('comprovante', file, (file as File).name ?? 'comprovante.jpg');

    console.log('[upload-proxy] Forwarding file to n8n:', {
      name: (file as File).name,
      size: file.size,
      type: file.type,
      webhookUrl: N8N_WEBHOOK_URL,
    });

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: outgoingFormData,
      // Do NOT set Content-Type header – fetch sets it automatically with the correct boundary
    });

    const responseText = await n8nResponse.text();

    console.log('[upload-proxy] n8n response:', {
      status: n8nResponse.status,
      body: responseText.substring(0, 500),
    });

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { error: `n8n retornou status ${n8nResponse.status}`, detail: responseText },
        { status: n8nResponse.status }
      );
    }

    // Attempt to parse as JSON, otherwise return raw
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({ success: true, data: parsed });
    } catch {
      return NextResponse.json({ success: true, raw: responseText });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[upload-proxy] Fatal error:', msg);
    return NextResponse.json(
      { error: 'Erro interno no proxy de upload', detail: msg },
      { status: 500 }
    );
  }
}
