# Estructura de Archivos JuanBlog

```
juanblog-orquestado/docs/
├── index.html                    # Página principal con buscador y filtros
├── data/
│   └── articles.json             # Índice de artículos (generado)
├── articulos/                    # Artículos publicados (estructura final)
│   ├── la-guerra-que-no-ves.html
│   ├── kant-magic-gimnasio.html
│   ├── el-libro-de-la-bestia.html
│   ├── lecciones-del-gimnasio.html
│   ├── crepusculo-de-los-invertebrados.html
│   ├── los-gigantes-del-orden.html
│   └── el-peso-muerto.html
├── drafts/                       # Borradores en desarrollo
│   ├── guerra-que-no-ves-v1.html
│   ├── kant-magic-gimnasio-v1.html
│   ├── bestia-domada-v1.html
│   ├── lecciones-gimnasio-v1.html
│   ├── crepusculo-invertebrados-v1.html
│   ├── gigantes-del-orden-v2.html
│   └── peso-muerto-grok-kimi-v1.html
├── css/                          # (opcional) Estilos compartidos
│   └── main.css
├── js/                           # (opcional) Scripts compartidos
│   └── main.js
└── assets/                       # Imágenes, fuentes, etc.
    └── images/
```

## Flujo de Trabajo

1. **Creación**: Los artículos se crean en `drafts/` con el sufijo `-v1.html`, `-v2.html`, etc.
2. **Revisión**: Se revisan y aprueban mediante el sistema de botones en cada borrador.
3. **Publicación**: Una vez aprobados, se mueven a `articulos/` con el slug definitivo.
4. **Indexación**: Se actualiza `data/articles.json` con los metadatos del artículo.

## Sistema de Tags

Los tags se definen en `articles.json` y tienen:
- `id`: Identificador único (ej: "política")
- `name`: Nombre visible (ej: "Política")
- `color`: Color asociado para UI futura
- `description`: Descripción para SEO/tooltips

## JSON de Índice

El archivo `data/articles.json` es la fuente de verdad para:
- Búsqueda en frontend
- Filtrado por tags
- Navegación entre artículos
- Generación de RSS (futuro)

**NO EDITAR MANUALMENTE** - Usar el script de generación (cuando esté disponible).
