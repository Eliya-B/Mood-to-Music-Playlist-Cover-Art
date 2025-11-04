import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=spotify_auth_failed`, request.nextUrl.origin))
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/?error=spotify_config_missing`, request.nextUrl.origin))
  }

  if (!redirectUri) {
    return NextResponse.redirect(new URL(`/?error=spotify_redirect_uri_missing`, request.nextUrl.origin))
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

    console.log("[v0] Callback - Access token exists:", !!data.access_token)
    console.log("[v0] Callback - Access token length:", data.access_token?.length || 0)
    console.log("[v0] Callback - Refresh token exists:", !!data.refresh_token)

    const redirectResponse = NextResponse.redirect(new URL(`/?auth=success`, request.nextUrl.origin))

    const isProduction = process.env.NODE_ENV === "production"

    // Set access token cookie
    redirectResponse.cookies.set({
      name: "spotify_access_token",
      value: data.access_token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    })

    // Set refresh token cookie if available
    if (data.refresh_token) {
      redirectResponse.cookies.set({
        name: "spotify_refresh_token",
        value: data.refresh_token,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
      })
    }

    console.log("[v0] Callback - Cookies set on redirect response")
    console.log("[v0] Callback - Is production:", isProduction)

    return redirectResponse
  } catch (error) {
    console.error("[v0] Spotify auth error:", error)
    return NextResponse.redirect(new URL(`/?error=spotify_token_exchange_failed`, request.nextUrl.origin))
  }
}
