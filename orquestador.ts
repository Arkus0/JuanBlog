import { llmClients } from './src/clients/llmClients';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface ArticleDraft {
  title: string;
  content: string;
  version: number;
  grokDraft: string;
  kimiRevision: string;
}

async function generateArticle(topic: string, targetWords: number = 800): Promise<ArticleDraft> {
  console.log('🚀 Iniciando pipeline Kimi + Grok...\n');

  // Paso 1: Grok escribe el borrador inicial (creatividad)
  console.log('🎨 Paso 1: Grok escribiendo borrador inicial...');
  console.log('   (Esto puede tardar 30-60 segundos...)\n');
  
  const grokPrompt = `Escribe un artículo sobre: "${topic}"

Estructura requerida:
- Introducción (100 palabras)
- 3 secciones de desarrollo (200 palabras cada una)
- Conclusión (100 palabras)

Contenido:
- Fundamentos técnicos/biomecánicos
- Beneficios prácticos
- Mitos comunes

Tono: Divulgativo pero basado en ciencia. Audiencia: entusiastas del fitness.

Responde SOLO con el artículo, sin explicaciones adicionales.`;

  const grokDraft = await llmClients.askGrok(grokPrompt, 'grok-3-mini');
  console.log('✅ Borrador de Grok recibido');
  console.log(`   Longitud: ${grokDraft.split(' ').length} palabras\n`);

  // Paso 2: Kimi revisa y mejora (red team + edición)
  console.log('🔍 Paso 2: Kimi revisando y mejorando...');
  const kimiPrompt = `Eres editor senior de contenido deportivo.

REGLAS ESTRICTAS:
1. Verifica precisión científica
2. Asegura: 1 H1, mínimo 3 H2, conclusión fuerte
3. Mejora fluidez sin perder la voz del autor
4. Formato: HTML limpio (h1, h2, p, ul, li, strong)

ARTÍCULO A REVISAR:
${grokDraft}

Entrega SOLO el HTML del body, sin etiquetas <html> ni <head>.`;

  const kimiRevision = await llmClients.askKimi(kimiPrompt, 'moonshotai/kimi-k2:free');
  console.log('✅ Revisión de Kimi completada\n');

  // Extraer título del H1
  const titleMatch = kimiRevision.match(/<h1>(.*?)<\/h1>/);
  const title = titleMatch ? titleMatch[1] : topic;

  // Limpiar HTML
  const cleanContent = kimiRevision
    .replace(/<html[^>]*>|<\/html>/gi, '')
    .replace(/<head[^>]*>.*?<\/head>/gi, '')
    .replace(/<body[^>]*>|<\/body>/gi, '')
    .trim();

  return {
    title,
    content: cleanContent,
    version: 1,
    grokDraft,
    kimiRevision: cleanContent
  };
}

async function saveDraft(draft: ArticleDraft): Promise<string> {
  const draftsDir = join(process.cwd(), 'drafts');
  if (!existsSync(draftsDir)) {
    mkdirSync(draftsDir, { recursive: true });
  }

  const slug = draft.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  const filename = `${slug}-v${draft.version}.html`;
  const filepath = join(draftsDir, filename);

  const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${draft.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; max-width: 720px; margin: 0 auto; padding: 40px 20px; color: #333; background: #fafafa; }
        h1 { font-size: 2.2em; color: #1a1a1a; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; }
        h2 { font-size: 1.5em; color: #2c3e50; margin-top: 40px; }
        .meta { background: #fff; border-left: 4px solid #3498db; padding: 15px 20px; margin-bottom: 30px; font-size: 0.9em; color: #666; }
        .actions { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px; }
        .btn { padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; }
        .btn-approve { background: #27ae60; color: white; }
        .btn-revise { background: #f39c12; color: white; }
        .status { position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 10px 20px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="status">BORRADOR - Pendiente de revisión</div>
    <div class="meta">
        <strong>Estado:</strong> Draft v${draft.version} | 
        <strong>Pipeline:</strong> Grok (creatividad) → Kimi (revisión) | 
        <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}
    </div>
    ${draft.content}
    <div class="actions">
        <button class="btn btn-revise" onclick="alert('Responde en Telegram: /revise [instrucciones]')">📝 Pedir Cambios</button>
        <button class="btn btn-approve" onclick="alert('Responde en Telegram: /approve')">✅ Aprobar</button>
    </div>
</body>
</html>`;

  writeFileSync(filepath, htmlTemplate);
  
  // También guardar en el repo de GitHub
  await saveToGitHub(filename, htmlTemplate);
  
  return filename;
}

async function saveToGitHub(filename: string, content: string): Promise<void> {
  const { execSync } = require('child_process');
  
  try {
    // Configurar git
    execSync('git config user.email "orquestador@juanblog.com"', { cwd: '/root/.openclaw/workspace/juanblog-orquestado' });
    execSync('git config user.name "Orquestador Kimi+Grok"', { cwd: '/root/.openclaw/workspace/juanblog-orquestado' });
    
    // Añadir y commitear
    execSync(`git add drafts/${filename}`, { cwd: '/root/.openclaw/workspace/juanblog-orquestado' });
    execSync(`git commit -m "Draft: ${filename}"`, { cwd: '/root/.openclaw/workspace/juanblog-orquestado' });
    execSync('git push origin main', { cwd: '/root/.openclaw/workspace/juanblog-orquestado' });
    
    console.log('📤 Subido a GitHub');
  } catch (e) {
    console.log('⚠️  No se pudo subir a GitHub (puede que ya exista)');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const topic = process.argv[2] || 'La importancia del peso muerto en el entrenamiento';
  const words = parseInt(process.argv[3]) || 800;

  generateArticle(topic, words)
    .then(async (draft) => {
      const filename = await saveDraft(draft);
      console.log('\n🎉 Artículo generado con éxito');
      console.log(`📄 Archivo: ${filename}`);
      console.log(`📊 Título: ${draft.title}`);
      console.log(`🤖 Pipeline: Grok → Kimi`);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

export { generateArticle, saveDraft };
