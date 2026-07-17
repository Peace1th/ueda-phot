import { google } from 'googleapis'

function getDrive() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function listDrivePhotos(folderId: string) {
  const drive = getDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 1000,
  })
  return (res.data.files ?? []).filter(f => f.id && f.name) as { id: string; name: string }[]
}

export async function listDriveMedia(folderId: string) {
  const drive = getDrive()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
    fields: 'files(id, name, mimeType)',
    orderBy: 'name',
    pageSize: 1000,
  })
  return (res.data.files ?? []).filter(f => f.id && f.name && f.mimeType) as { id: string; name: string; mimeType: string }[]
}

export async function streamDriveFile(fileId: string, range?: string | null): Promise<{
  stream: ReadableStream<Uint8Array>
  contentType: string
  contentLength?: string
  contentRange?: string
  status: number
}> {
  const drive = getDrive()
  const meta = await drive.files.get({ fileId, fields: 'mimeType,size' })
  const mimeType = meta.data.mimeType ?? 'video/mp4'

  const reqHeaders: Record<string, string> = {}
  if (range) reqHeaders['Range'] = range

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream', headers: reqHeaders } as object,
  )
  const nodeStream = res.data as NodeJS.ReadableStream
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', err => controller.error(err))
    },
    cancel() {
      if (typeof (nodeStream as NodeJS.ReadableStream & { destroy?: () => void }).destroy === 'function') {
        (nodeStream as NodeJS.ReadableStream & { destroy: () => void }).destroy()
      }
    },
  })

  const headers = res.headers as Record<string, string>
  return {
    stream: readable,
    contentType: mimeType,
    contentLength: headers['content-length'],
    contentRange: headers['content-range'],
    status: range ? 206 : 200,
  }
}

export async function getDriveFileBuffer(fileId: string): Promise<Buffer> {
  const drive = getDrive()
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )
  return Buffer.from(res.data as ArrayBuffer)
}

export async function getDriveFileWithName(fileId: string): Promise<{ buffer: Buffer; name: string }> {
  const drive = getDrive()
  const [meta, content] = await Promise.all([
    drive.files.get({ fileId, fields: 'name' }),
    drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' }),
  ])
  const rawName = (meta.data.name ?? 'photo').replace(/\.[^.]+$/, '')
  return {
    buffer: Buffer.from(content.data as ArrayBuffer),
    name: `${rawName}.jpg`,
  }
}
