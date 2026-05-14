import { NextResponse } from 'next/server';
import FormData from 'form-data';

export const runtime = 'nodejs';
export const maxDuration = 30;

const N8N_WEBHOOK_URL = 'https://vitalino.app.n8n.cloud/webhook/comprovantes-2026';

/**
 * GET /api/upload-comprovante
 * Diagnostic endpoint – tests connectivity to n8n webhook.
 */
export async function GET() {
  try {
    const start = Date.now();
    const res = await fetch(N8N_WEBHOOK_URL, { method: 'GET' });
    const elapsed = Date.now() - start;
    const body = await res.text();
    return NextResponse.json({
      reachable: true,
      status: res.status,
      elapsed_ms: elapsed,
      body_preview: body.substring(0, 200),
      webhook_url: N8N_WEBHOOK_URL,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ reachable: false, error: msg, webhook_url: N8N_WEBHOOK_URL }, { status: 502 });
  }
}

/**
 * POST /api/upload-comprovante
 * Proxy to forward the comprovante file to the n8n webhook,
 * using form-data library for proper multipart/form-data encoding.
 */
export async function POST(request: Request) {
  try {
    const incomingFormData = await request.formData();
    const file = incomingFormData.get('comprovante');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo recebido no campo "comprovante"' },
        { status: 400 }
      );
    }

    const fileName = (file as File).name || 'comprovante.jpg';
    const fileType = file.type || 'image/jpeg';
    const fileSize = file.size;

    console.log('[upload-proxy] Received file:', { fileName, fileType, fileSize });

    // Read file as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use form-data library to build multipart/form-data correctly
    const form = new FormData();
    form.append('comprovante', buffer, {
      filename: fileName,
      contentType: fileType,
    });

    console.log('[upload-proxy] Forwarding to n8n:', {
      webhookUrl: N8N_WEBHOOK_URL,
      fileSize: buffer.length,
    });

    // Forward to n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form.getBuffer(),
    });

    const responseText = await n8nResponse.text();

    console.log('[upload-proxy] n8n response:', {
      status: n8nResponse.status,
      statusText: n8nResponse.statusText,
      body: responseText.substring(0, 500),
    });

    if (!n8nResponse.ok) {
      return NextResponse.json(
        {
          error: `n8n retornou status ${n8nResponse.status} (${n8nResponse.statusText})`,
          detail: responseText.substring(0, 1000),
          webhook_url: N8N_WEBHOOK_URL,
        },
        { status: n8nResponse.status }
      );
    }

    // Attempt to parse n8n's response as JSON
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({ success: true, data: parsed });
    } catch {
      return NextResponse.json({ success: true, raw: responseText });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    console.error('[upload-proxy] Fatal error:', msg, stack);

    return NextResponse.json(
      { error: 'Erro interno no proxy de upload', detail: msg },
      { status: 500 }
    );
  }
}
