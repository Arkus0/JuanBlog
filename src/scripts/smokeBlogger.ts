import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

function fail(message: string, details?: unknown): never {
  const extra = details ? `\nDetalles: ${JSON.stringify(details)}` : '';
  throw new Error(`SMOKE_BLOGGER_FAIL: ${message}${extra}`);
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') fail(`Falta variable obligatoria: ${name}`);
  return value;
}

async function main() {
  const clientId = required('GOOGLE_CLIENT_ID');
  const clientSecret = required('GOOGLE_CLIENT_SECRET');
  const refreshToken = required('GOOGLE_REFRESH_TOKEN');
  const blogId = required('BLOGGER_BLOG_ID');

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });

  const blogger = google.blogger('v3');

  let token: string | null | undefined;
  try {
    token = (await oauth2.getAccessToken()).token;
  } catch (error) {
    fail('No se pudo autenticar con refresh_token (oauth2.getAccessToken). Revisa invalid_grant/credenciales.', error);
  }

  if (!token) {
    fail('OAuth2 no devolvió access token. Posible refresh_token inválido o sin offline access.');
  }

  try {
    const blog = await blogger.blogs.get({ auth: oauth2, blogId });
    console.log(`✅ Smoke auth + read OK. Blog: ${blog.data.name ?? 'sin-nombre'} (${blog.data.id})`);
  } catch (error: any) {
    const msg = String(error?.message ?? error);
    if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('permission')) {
      fail('Permisos insuficientes para Blogger API. Revisa scope https://www.googleapis.com/auth/blogger.', msg);
    }
    if (msg.includes('notFound') || msg.includes('404')) {
      fail('BLOGGER_BLOG_ID inválido o inaccesible.', msg);
    }
    fail('Falló llamada blogs.get.', msg);
  }

  if (process.env.SMOKE_CREATE_DRAFT === 'true') {
    try {
      const created = await blogger.posts.insert({
        auth: oauth2,
        blogId,
        isDraft: true,
        requestBody: {
          title: `[SMOKE] ${new Date().toISOString()}`,
          content: '<h1>Smoke</h1><p>Draft de prueba</p>',
          labels: ['smoke-test']
        }
      });
      console.log(`✅ Smoke draft creado: postId=${created.data.id} url=${created.data.url ?? 'n/a'}`);
    } catch (error) {
      fail('No se pudo crear draft de smoke (SMOKE_CREATE_DRAFT=true).', error);
    }
  } else {
    console.log('ℹ️ SMOKE_CREATE_DRAFT!=true; se omite creación de draft de prueba.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
