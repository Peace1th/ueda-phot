import { createHmac } from 'crypto'

const SECRET = process.env.TOKEN_SECRET ?? 'dev-secret-change-me'

export function createToken(slug: string): string {
  const ts = Date.now()
  const sig = createHmac('sha256', SECRET).update(`${slug}:${ts}`).digest('hex')
  return `${slug}.${ts}.${sig}`
}

export function verifyToken(token: string, slug: string): boolean {
  try {
    // Split from the right so slugs containing dots work correctly
    const lastDot = token.lastIndexOf('.')
    const secondLastDot = token.lastIndexOf('.', lastDot - 1)
    if (lastDot === -1 || secondLastDot === -1) return false
    const tSlug = token.slice(0, secondLastDot)
    const ts = token.slice(secondLastDot + 1, lastDot)
    const sig = token.slice(lastDot + 1)
    if (tSlug !== slug) return false
    const age = Date.now() - parseInt(ts)
    if (age > 6 * 60 * 60 * 1000) return false   // 6時間で失効
    const expected = createHmac('sha256', SECRET).update(`${slug}:${ts}`).digest('hex')
    return sig === expected
  } catch {
    return false
  }
}
