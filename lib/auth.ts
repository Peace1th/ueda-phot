import { createHmac } from 'crypto'

const SECRET = process.env.TOKEN_SECRET ?? 'dev-secret-change-me'

export function createToken(slug: string): string {
  const ts = Date.now()
  const sig = createHmac('sha256', SECRET).update(`${slug}:${ts}`).digest('hex')
  return `${slug}.${ts}.${sig}`
}

export function verifyToken(token: string, slug: string): boolean {
  try {
    const [tSlug, ts, sig] = token.split('.')
    if (tSlug !== slug) return false
    const age = Date.now() - parseInt(ts)
    if (age > 6 * 60 * 60 * 1000) return false   // 6時間で失効
    const expected = createHmac('sha256', SECRET).update(`${slug}:${ts}`).digest('hex')
    return sig === expected
  } catch {
    return false
  }
}
