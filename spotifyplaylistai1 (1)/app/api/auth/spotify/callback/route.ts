import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return Response.redirect(`${request.nextUrl.origin}?error=spotify_auth_failed`)
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  if (!clientId || !clientSecret) {
    return Response.redirect(`${request.nextUrl.origin}?error=spotify_config_missing`)
  }

  if (!redirectUri) {
    return Response.redirect(`${request.nextUrl.origin}?error=spotify_redirect_uri_missing`)
  }

  try {
    // Exchange code for access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const data = await response.json()

    // Store tokens in cookies
    const cookieStore = await cookies()
    cookieStore.set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.expires_in,
      sameSite: "lax",
    })

    if (data.refresh_token) {
      cookieStore.set("spotify_refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
      })
    }

    return Response.redirect(`${request.nextUrl.origin}?auth=success`)
  } catch (error) {
    console.error("Spotify auth error:", error)
    return Response.redirect(`${request.nextUrl.origin}?error=spotify_token_exchange_failed`)
  }
}
