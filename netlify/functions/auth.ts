const expectedPassword = () =>
  process.env.APP_PASSWORD || process.env.VITE_APP_PASSWORD || 'zwb-studio'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405 })
  }

  let password = ''
  try {
    const body = (await req.json()) as { password?: unknown }
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }

  if (password === expectedPassword()) {
    return Response.json({ ok: true })
  }

  return Response.json({ ok: false }, { status: 401 })
}
