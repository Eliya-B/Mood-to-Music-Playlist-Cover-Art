import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete("spotify_access_token")
  cookieStore.delete("spotify_refresh_token")

  return Response.json({ success: true })
}
