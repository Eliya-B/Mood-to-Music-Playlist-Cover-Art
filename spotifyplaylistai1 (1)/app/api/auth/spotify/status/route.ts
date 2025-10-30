import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("spotify_access_token")

  return Response.json({
    authenticated: !!accessToken,
  })
}
