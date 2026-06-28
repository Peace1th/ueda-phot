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
