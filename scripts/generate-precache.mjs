import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = resolve(projectRoot, 'dist')
const workerPath = resolve(distRoot, 'sw.js')

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  }))
  return nested.flat()
}

const outputFiles = await listFiles(distRoot)
// Keep the first offline install light on older phones and computers. Larger
// optional document-reader assets are fetched and runtime-cached when used.
const cacheableFiles = await Promise.all(outputFiles
  .filter((path) => path !== workerPath)
  .map(async (path) => ({ path, bytes: (await stat(path)).size })))
const offlineFiles = cacheableFiles.filter(({ bytes }) => bytes <= 500 * 1024).map(({ path }) => path)
const urls = ['./', './index.html', ...offlineFiles
  .map((path) => `./${relative(distRoot, path).split(sep).join('/')}`)]
const uniqueUrls = [...new Set(urls)]
const worker = await readFile(workerPath, 'utf8')
const fallback = "const PRECACHE_URLS = ['./', './index.html', './manifest.webmanifest', './favicon.svg']"
const cacheKey = createHash('sha256').update(uniqueUrls.join('\n')).digest('hex').slice(0, 10)
const versioned = worker.replace("const CACHE_NAME = 'carepath-shell-v1'", `const CACHE_NAME = 'carepath-shell-${cacheKey}'`)
if (!versioned.includes(fallback)) throw new Error('The CAREPATH service worker precache placeholder was not found.')
await writeFile(workerPath, versioned.replace(fallback, `const PRECACHE_URLS = ${JSON.stringify(uniqueUrls)}`), 'utf8')
console.log(`Prepared offline cache for ${uniqueUrls.length} app files (${cacheableFiles.length - offlineFiles.length} large optional assets will cache when used).`)
