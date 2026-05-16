import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseUrl } from 'node:url'

const toolDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(toolDir, '..')

function loadEnvFromFile(path: string) {
  if (!existsSync(path)) {
    return
  }

  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFromFile(resolve(rootDir, '.env.local'))
loadEnvFromFile(resolve(rootDir, '.env'))

const handlers = {
  '/api/coach/analyze': (await import('../api/coach/analyze.ts')).default,
  '/api/coach/save-analysis': (await import('../api/coach/save-analysis.ts')).default,
  '/api/leaderboard': (await import('../api/leaderboard.ts')).default,
  '/api/matches/save': (await import('../api/matches/save.ts')).default,
  '/api/profile/upgrade': (await import('../api/profile/upgrade.ts')).default,
  '/api/rooms/create': (await import('../api/rooms/create.ts')).default,
  '/api/rooms/join': (await import('../api/rooms/join.ts')).default,
  '/api/rooms/move': (await import('../api/rooms/move.ts')).default,
}

type ResponseWithHelpers = ReturnType<typeof patchResponse>

function patchResponse(res: Parameters<typeof createServer>[0] extends never ? never : any) {
  const response = res as any

  response.status = function status(code: number) {
    response.statusCode = code
    return response
  }

  response.json = function json(payload: unknown) {
    if (!response.headersSent) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
    }

    response.end(JSON.stringify(payload))
    return response
  }

  return response
}

function collectBody(req: any) {
  return new Promise<unknown>((resolveBody, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')

      if (!raw) {
        resolveBody(undefined)
        return
      }

      try {
        resolveBody(JSON.parse(raw))
      } catch {
        resolveBody(raw)
      }
    })
    req.on('error', reject)
  })
}

const apiServer = createServer(async (req: any, res) => {
  const url = parseUrl(req.url ?? '', true)
  const handler = handlers[url.pathname as keyof typeof handlers]

  if (!handler) {
    patchResponse(res).status(404).json({ error: 'API route not found.' })
    return
  }

  try {
    req.query = url.query ?? {}
    req.body = await collectBody(req)
    await handler(req, patchResponse(res) as ResponseWithHelpers)
  } catch (error) {
    patchResponse(res)
      .status(500)
      .json({
        error: error instanceof Error ? error.message : 'Unexpected local API error.',
      })
  }
})

apiServer.listen(8787, '127.0.0.1', () => {
  console.log('Local cloud API listening on http://127.0.0.1:8787')
})

const viteEntrypoint = resolve(rootDir, 'node_modules', 'vite', 'bin', 'vite.js')

const vite = spawn(
  process.execPath,
  [viteEntrypoint, '--host', '127.0.0.1', '--port', '5173'],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
    env: process.env,
  },
)

let shuttingDown = false

function shutdown(code = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  apiServer.close()

  if (!vite.killed) {
    vite.kill('SIGINT')
  }

  process.exit(code)
}

vite.on('exit', (code) => {
  shutdown(code ?? 0)
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
