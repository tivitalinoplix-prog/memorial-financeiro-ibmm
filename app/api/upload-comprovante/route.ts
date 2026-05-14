import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const N8N_WEBHOOK_URL = 'https://vitalino.app.n8n.cloud/webhook/comprovantes-2026';

/**
 * GET /api/upload-comprovante
 * Diagnostic endpoint – tests connectivity to n8n webhook.
 */
export async function GET() {
  try {
    // n8n webhooks typically only accept POST, so a GET may return 404 or 405.
    // We use it just to test DNS resolution and network connectivity.
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
 * bypassing browser CORS restrictions.
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

    // Read file as ArrayBuffer for a clean re-send
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Build multipart/form-data manually using the Node.js-native FormData
    // This avoids issues with the web FormData API in serverless environments
    const boundary = '----n8nUploadBoundary' + Date.now();
    const CRLF = '\r\n';

    const header = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="comprovante"; filename="${fileName}"`,
      `Content-Type: ${fileType}`,
      '',
      '',
    ].join(CRLF);

    const footer = CRLF + `--${boundary}--` + CRLF;

    const headerBuffer = Buffer.from(header, 'utf-8');
    const footerBuffer = Buffer.from(footer, 'utf-8');
    const body = Buffer.concat([headerBuffer, buffer, footerBuffer]);

    console.log('[upload-proxy] Forwarding to n8n:', {
      webhookUrl: N8N_WEBHOOK_URL,
      bodySize: body.length,
      boundary,
    });

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
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
