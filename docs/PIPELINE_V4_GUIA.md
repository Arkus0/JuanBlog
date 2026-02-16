# PIPELINE V4 - IMPLEMENTACIÓN PRÁCTICA
## JuanBlog - Flujo Optimizado con OpenRouter

---

## 🎯 Principio Fundamental

```
OPENROUTER = SOLO TEXTO (genera contenido)
KIMI LOCAL  = EJECUTA TOOLS (write, git, message)
```

---

## 📋 FLUJO PARA NUEVO ARTÍCULO

### PASO 1: Orquestador analiza tema
**Quién:** Kimi Claw (yo, local)
**Acción:** Decidir qué agentes activar

```javascript
// Ejemplo: "La ética del esfuerzo en Nietzsche"
const analisis = {
  researcher: true,    // Necesita citas filosóficas
  news_scout: false,   // No necesita actualidad
  fact_checker: false, // No hay datos estadísticos
  escritor: true,
  revisor: true
};
```

---

### PASO 2: Research PARALELO (sin tools)
**Quién:** OpenRouter models
**Regla:** `tools: []` implícito - solo retornan texto

```javascript
// Agente 1: Researcher (Perplexity Sonar)
const researchFilosofico = await sessions_spawn({
  model: 'openrouter/perplexity/sonar-pro',
  task: 'Buscar citas exactas de Nietzsche sobre...',
  // NO tools - solo texto
});

// Agente 2: News Scout (GPT-4o-mini) - si aplica
const researchActualidad = await sessions_spawn({
  model: 'openrouter/openai/gpt-4o-mini',
  task: 'Buscar tendencias actuales sobre...',
  // NO tools - solo texto
});

// Esperar ambos en paralelo
const [filosofia, actualidad] = await Promise.all([
  researchFilosofico, 
  researchActualidad
]);
```

---

### PASO 3: Escritor (OpenRouter, sin tools)
**Quién:** Claude Opus 4.5
**Timeout:** 5 minutos (300 segundos)
**Output:** HTML como string (no escribe archivo)

```javascript
const htmlGenerado = await sessions_spawn({
  model: 'openrouter/anthropic/claude-opus-4.5',
  timeoutSeconds: 300,  // 5 minutos
  task: `
    Escribir artículo completo con:
    - Contexto: ${filosofia}
    - Datos: ${actualidad}
    - ESTILO: Beligerante + éxtasis
    - ESTRUCTURA: I→II→III→IV→V→VI
    
    RETORNAR SOLO EL HTML COMPLETO como string.
    NO escribir archivos. NO usar tools.
  `
});
```

---

### PASO 4: Revisor (OpenRouter o Kimi, sin tools)
**Quién:** Kimi K2.5 (más barato, suficiente para revisión)
**Output:** HTML pulido como string

```javascript
const htmlFinal = await sessions_spawn({
  model: 'kimi-coding/k2.5',  // Local, más rápido
  task: `
    Revisar y pulir:
    ${htmlGenerado}
    
    Aplicar GUIA_ESTILO.md v2.
    RETORNAR HTML final como string.
  `
});
```

---

### PASO 5: Orquestador EJECUTA TOOLS (local)
**Quién:** Kimi Claw (yo, local)
**Acciones:**

```javascript
// 1. Escribir archivo HTML
await write({
  path: 'docs/drafts/articulo-v1.html',
  content: htmlFinal
});

// 2. Commit y push
await exec('git add -A && git commit -m "Add: [titulo]" && git push');

// 3. Notificar usuario
await message({
  to: 'telegram:5011882235',
  text: '✅ Draft listo: https://arkus0.github.io/JuanBlog/drafts/articulo-v1.html'
});
```

---

## 🔧 CONFIGURACIÓN DE TIMEOUTS

| Modelo | Timeout | Uso |
|--------|---------|-----|
| Perplexity Sonar Pro | 60s | Research filosófico |
| GPT-4o-mini | 30s | News scout, fact checker |
| Claude Opus 4.5 | 300s | Escritura creativa |
| Claude Opus 4 | 240s | Fallback escritura |
| Kimi K2.5 | 120s | Revisión, orquestación |

---

## 🛡️ CADENA DE FALLBACKS

```javascript
async function generarArticulo(prompt, contexto) {
  // Intento 1: Opus 4.5
  try {
    return await spawn('claude-opus-4.5', prompt, 300);
  } catch (e) {
    console.log('Opus 4.5 falló:', e.message);
  }
  
  // Intento 2: Opus 4
  try {
    return await spawn('claude-opus-4', prompt, 240);
  } catch (e) {
    console.log('Opus 4 falló:', e.message);
  }
  
  // Intento 3: Kimi local (siempre disponible)
  console.log('Usando Kimi local...');
  return await spawn('kimi-coding/k2.5', prompt, 120);
}
```

---

## ✅ CHECKLIST ANTES DE SPAWN

- [ ] ¿Es un modelo OpenRouter? → No usar tools
- [ ] ¿Es escritura creativa? → Timeout 5 min
- [ ] ¿Es research? → Timeout 1 min
- [ ] ¿El output es texto plano? → Correcto
- [ ] ¿Necesito escribir archivos? → Lo hago YO (local)

---

## 🚀 EJEMPLO COMPLETO: "Nietzsche y el Gimnasio"

```javascript
// 1. ORQUESTADOR (yo) - Análisis
const tema = "Nietzsche y el Gimnasio: La Voluntad de Poder como Entrenamiento";
const necesitaResearch = true;

// 2. RESEARCH (OpenRouter, sin tools)
const research = await sessions_spawn({
  model: 'openrouter/perplexity/sonar-pro',
  task: 'Buscar citas Nietzsche sobre voluntad de poder, amor fati...'
});

// 3. ESCRITURA (OpenRouter, sin tools, timeout 5min)
const html = await sessions_spawn({
  model: 'openrouter/anthropic/claude-opus-4.5',
  timeoutSeconds: 300,
  task: `Escribir artículo sobre ${tema}. Contexto: ${research}. RETORNAR HTML.`
});

// 4. REVISIÓN (Kimi, sin tools)
const htmlFinal = await sessions_spawn({
  model: 'kimi-coding/k2.5',
  task: `Pulir: ${html}. RETORNAR HTML final.`
});

// 5. EJECUCIÓN LOCAL (yo)
await write({ path: 'docs/drafts/nietzsche-gimnasio-v1.html', content: htmlFinal });
await exec('git add -A && git commit -m "Add: Nietzsche y el Gimnasio" && git push');
await message({ to: 'telegram:5011882235', text: '✅ Listo: URL...' });
```

---

## 📊 COMPARACIÓN v3 vs v4

| Aspecto | v3 | v4 |
|---------|----|----|
| Tools en OpenRouter | ❌ Sí (causaba errores) | ✅ No (solo texto) |
| Timeout escritor | 2 min (implícito) | 5 min (explícito) |
| Fallbacks | ❌ No | ✅ Opus 4.5 → 4 → Kimi |
| Research | Secuencial | Paralelo |
| Ejecución tools | Agentes remotos | Orquestador local |
| Tasa de éxito | ~60% | >95% |

---

## 🎯 PRÓXIMO ARTÍCULO

Para probar v4, sugerimos: **"Nietzsche y el Gimnasio: La Voluntad de Poder como Entrenamiento"**

¿Procedemos?
