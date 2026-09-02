// Inject the Launch resource catalog and schema into static HTML.
// The historical filename and data path remain stable while /launch becomes
// the canonical public surface.
import { readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PAGE = resolve(ROOT, 'launch.html')
const DATA = resolve(ROOT, 'data/curriculum.json')
const SITE = 'https://mergecombinator.com'

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const TYPE_LABEL = { external: 'External', gated: 'Defense Builders', learn: 'Learn', signal: 'Signal' }
const ICONS = {
  external: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  gated: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  learn: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  signal: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
}

const catalog = JSON.parse(readFileSync(DATA, 'utf8'))
const stages = catalog.stages
if (!Array.isArray(stages) || stages.length !== 5) throw new Error('curriculum.json must contain five stages')
const resourceIds = stages.flatMap((stage) => stage.resources.map((resource) => resource.id))
if (new Set(resourceIds).size !== resourceIds.length) throw new Error('curriculum.json contains duplicate resource ids')

function resourceCard(resource, stageId) {
  const external = resource.type === 'external'
  const gated = resource.type === 'gated'
  const meta = [resource.sourceLabel, `${resource.timeToRead} min`, TYPE_LABEL[resource.type] || resource.type]
    .filter(Boolean).map(esc).join(' · ')
  const classes = ['launch-resource', external && 'launch-resource--external', gated && 'launch-resource--gated']
    .filter(Boolean).join(' ')
  const href = gated
    ? `/access?context=builders&amp;source=launch-${encodeURIComponent(resource.id)}`
    : esc(resource.url)
  const gate = gated ? `<p class="launch-resource__gate">${esc(resource.gateName || 'Defense Builders')}</p>` : ''
  return `
          <div class="launch-resource-wrap${gated ? ' launch-resource-wrap--gated' : ''}" data-resource-id="${esc(resource.id)}" data-stage-id="${esc(stageId)}">
            <button class="launch-resource__check" type="button" aria-pressed="false" aria-label="Mark &quot;${esc(resource.title)}&quot; as explored"></button>
            <a href="${href}" class="${classes}"${external ? ' target="_blank" rel="noopener"' : ''}>
              <svg class="launch-resource__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${ICONS[resource.type] || ICONS.external}</svg>
              <div class="launch-resource__text">
                <p class="launch-resource__title">${esc(resource.title)}</p>
                <p class="launch-resource__meta">${esc(resource.description)}</p>
                <p class="launch-resource__details">${meta}</p>
                ${gate}
              </div>
            </a>
          </div>`
}

function inject(html, pattern, content, label) {
  if (!pattern.test(html)) throw new Error(`Launch injection marker missing: ${label}`)
  return html.replace(pattern, (_match, start, end) => `${start}${content}\n          ${end}`)
}

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Launch — Merge Combinator',
      url: `${SITE}/launch`,
      description: 'A five-stage mission path for defense technology builders, from first orientation to operational scale.',
      isPartOf: { '@type': 'WebSite', name: 'Merge Combinator', url: SITE },
    },
    {
      '@type': 'HowTo',
      name: 'The Defense Tech Launch Sequence',
      url: `${SITE}/launch`,
      description: 'Five stages from first orientation to operational scale: Preflight, Spot, Ready for Launch, Tension, and Launch.',
      step: stages.map((stage, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: stage.title,
        text: stage.description,
        url: `${SITE}/launch#stage-${stage.id}`,
        itemListElement: stage.resources.map((resource, resourceIndex) => {
          const item = { '@type': 'ListItem', position: resourceIndex + 1, name: resource.title }
          if (resource.type !== 'gated') item.url = resource.url.startsWith('/') ? SITE + resource.url : resource.url
          return item
        }),
      })),
    },
  ],
}
const jsonLd = JSON.stringify(graph, null, 2).replace(/</g, '\\u003c')

let html = readFileSync(PAGE, 'utf8')
for (const stage of stages) {
  const marker = new RegExp(`(<!-- LAUNCH:RESOURCES:${stage.id}:START -->)[\\s\\S]*?(<!-- LAUNCH:RESOURCES:${stage.id}:END -->)`)
  html = inject(html, marker, stage.resources.map((resource) => resourceCard(resource, stage.id)).join(''), `resources:${stage.id}`)
}
html = inject(
  html,
  /(<!-- LAUNCH:JSONLD:START -->)[\s\S]*?(<!-- LAUNCH:JSONLD:END -->)/,
  `\n  <script type="application/ld+json">\n${jsonLd}\n  </script>`,
  'jsonld',
)
writeFileSync(PAGE, html)

console.log(`[launch] injected ${stages.length} stages and ${resourceIds.length} resources into launch.html`)
