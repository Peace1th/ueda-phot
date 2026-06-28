// 写真のアップロードは Google Drive に直接行ってください。
// このエンドポイントは使用していません。
export async function POST() {
  return Response.json({ error: '写真は Google Drive に直接アップロードしてください' }, { status: 410 })
}
