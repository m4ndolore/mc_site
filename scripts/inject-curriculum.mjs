// scripts/inject-curriculum.mjs — inject curriculum content as static HTML
// Follows the optimize-static.mjs pattern: mutates source HTML in place at
// build time so crawlers and no-JS visitors get the full syllabus.
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const PAGE = resolve(ROOT, 'curriculum.html')
const DATA = resolve(ROOT, 'data/curriculum.json')

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const TYPE_LABEL = { external: 'External', gated: 'Gated', learn: 'Learn', signal: 'Signal' }
const SITE = 'https://mergecombinator.com'

const curriculum = JSON.parse(readFileSync(DATA, 'utf8'))
const stages = curriculum.stages
if (!Array.isArray(stages) || stages.length === 0) throw new Error('curriculum.json: stages missing or empty')
const ids = stages.flatMap(s => s.resources.map(r => r.id))
if (new Set(ids).size !== ids.length) throw new Error('curriculum.json: duplicate resource ids')

function resourceRow(r, stageId) {
  const external = r.type === 'external'
  const meta = [r.sourceLabel, `${r.timeToRead} min`, TYPE_LABEL[r.type] || r.type]
    .filter(Boolean).map(esc).join(' · ')
  return `
        <div class="cur-resource" data-resource-id="${esc(r.id)}" data-stage-id="${esc(stageId)}">
          <button class="cur-resource__check" type="button" aria-pressed="false" aria-label="Mark &quot;${esc(r.title)}&quot; as explored"></button>
          <a class="cur-resource__link" href="${esc(r.url)}"${external ? ' target="_blank" rel="noopener"' : ''}>
            <span class="cur-resource__body">
              <span class="cur-resource__title">${esc(r.title)}</span>
              <span class="cur-resource__desc">${esc(r.description)}</span>
              <span class="cur-resource__meta">${meta}</span>
            </span>
            <span class="cur-resource__open" aria-hidden="true">Open ${external ? '↗' : '→'}</span>
          </a>
        </div>`
}

function stageSection(s, i) {
  const num = String(i + 1).padStart(2, '0')
  return `
      <section class="cur-stage" data-stage-id="${esc(s.id)}" data-stage-index="${i}" id="stage-${esc(s.id)}">
        <div class="cur-stage__head">
          <span class="cur-stage__num">${num}</span>
          <h2 class="cur-stage__title">${esc(s.title)}</h2>
          <p class="cur-stage__subtitle">${esc(s.subtitle)}</p>
        </div>
        <p class="cur-stage__desc">${esc(s.description)}</p>
        <div class="cur-stage__resources">${s.resources.map(r => resourceRow(r, s.id)).join('')}
        </div>
        <div class="cur-stage__actions">
          <p class="cur-stage__count"></p>
          <button class="fp-btn fp-btn--primary cur-advance" data-advance-from="${esc(s.id)}" hidden></button>
        </div>
      </section>`
}

function railItem(s, i) {
  return `
              <li><a href="#stage-${esc(s.id)}" class="cur-rail__link" data-rail-stage="${esc(s.id)}">
                <span class="cur-rail__marker" aria-hidden="true"></span>
                <span class="cur-rail__label">${i + 1}. ${esc(s.title)}</span>
              </a></li>`
}

const jsonld = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Defense Builders Curriculum',
  description: 'Progressive five-stage curriculum for defense tech founders: Preflight, Spot, Ready for Launch, Tension, Launch.',
  url: 'https://mergecombinator.com/curriculum',
  provider: { '@type': 'Organization', name: 'Merge Combinator', url: 'https://mergecombinator.com' },
  hasPart: stages.map((s, i) => ({
    '@type': 'ItemList',
    name: `Stage ${i + 1}: ${s.title}`,
    description: s.description,
    itemListElement: s.resources.map((r, j) => {
      const item = { '@type': 'ListItem', position: j + 1, name: r.title }
      // Gated resources all point at /access; duplicate URLs dilute the
      // ItemList, so emit them as name-only ListItems (valid schema).
      if (r.type !== 'gated') item.url = r.url.startsWith('/') ? SITE + r.url : r.url
      return item
    }),
  })),
  // Escape < so data can never break out of the inline <script> tag (still valid JSON).
}, null, 2).replace(/</g, '\\u003c')

function inject(html, tag, content) {
  const re = new RegExp(`(<!-- CURRICULUM:${tag}:START -->)[\\s\\S]*?(<!-- CURRICULUM:${tag}:END -->)`)
  if (!re.test(html)) throw new Error(`Marker CURRICULUM:${tag} not found in curriculum.html`)
  // Function replacement so `$` in content (e.g. "$16B") is never treated
  // as a capture-group reference by String.replace.
  return html.replace(re, (_m, start, end) => `${start}${content}\n    ${end}`)
}

let html = readFileSync(PAGE, 'utf8')
html = inject(html, 'CONTENT', stages.map(stageSection).join('\n'))
html = inject(html, 'RAIL', stages.map(railItem).join(''))
html = inject(html, 'JSONLD', `\n<script type="application/ld+json">\n${jsonld}\n</script>`)
writeFileSync(PAGE, html)

const total = stages.reduce((n, s) => n + s.resources.length, 0)
console.log(`[curriculum] injected ${stages.length} stages, ${total} resources into curriculum.html`)
