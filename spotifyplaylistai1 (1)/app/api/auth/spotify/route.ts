import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  if (!clientId) {
    return Response.json({ error: "Spotify client ID not configured" }, { status: 500 })
  }

  if (!redirectUri) {
    return Response.json({ error: "Spotify redirect URI not configured" }, { status: 500 })
  }

  const scope = "playlist-modify-public playlist-modify-private"

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scope,
  })

  return Response.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
}
