import { readdir, stat } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url))
const KIB = 1024
const MIB = 1024 * KIB

const budgets = [
  {
    label: 'PDF.js worker',
    matches: file => basename(file).startsWith('pdf.worker.min-'),
    maxBytes: 2 * MIB,
  },
  {
    label: 'PDF reader bundle',
    matches: file => basename(file).startsWith('learn-read-') && extname(file) === '.js',
    maxBytes: 512 * KIB,
  },
  {
    label: 'JavaScript',
    matches: file => extname(file) === '.js' || extname(file) === '.mjs',
    maxBytes: 128 * KIB,
  },
  {
    label: 'Image',
    matches: file => ['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extname(file)),
    maxBytes: 1 * MIB,
  },
  {
    label: 'CSS',
    matches: file => extname(file) === '.css',
    maxBytes: 128 * KIB,
  },
  {
    label: 'HTML',
    matches: file => extname(file) === '.html',
    maxBytes: 128 * KIB,
  },
  {
    label: 'PDF',
    matches: file => extname(file) === '.pdf',
    maxBytes: 24 * MIB,
  },
]

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? collectFiles(path) : [path]
  }))
  return files.flat()
}

function formatBytes(bytes) {
  if (bytes >= MIB) return `${(bytes / MIB).toFixed(2)} MiB`
  return `${(bytes / KIB).toFixed(1)} KiB`
}

let files
try {
  files = await collectFiles(DIST_DIR)
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('[performance] dist/ is missing. Run npm run build first.')
    process.exit(1)
  }
  throw error
}

const failures = []
for (const file of files) {
  const budget = budgets.find(candidate => candidate.matches(file))
  if (!budget) continue

  const { size } = await stat(file)
  if (size > budget.maxBytes) {
    failures.push({
      file: relative(DIST_DIR, file),
      label: budget.label,
      size,
      maxBytes: budget.maxBytes,
    })
  }
}

if (failures.length > 0) {
  console.error('[performance] Asset budget exceeded:')
  for (const failure of failures.sort((a, b) => b.size - a.size)) {
    console.error(
      `  ${failure.file}: ${formatBytes(failure.size)} ` +
      `(${failure.label} limit ${formatBytes(failure.maxBytes)})`,
    )
  }
  process.exit(1)
}

console.log(`[performance] ${files.length} production files are within budget.`)
