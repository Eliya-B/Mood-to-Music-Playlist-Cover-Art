import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Logout - Deleting cookies...")

  const response = NextResponse.json({ success: true })

  response.cookies.delete({
    name: "spotify_access_token",
    path: "/",
  })

  response.cookies.delete({
    name: "spotify_refresh_token",
    path: "/",
  })

  console.log("[v0] Logout - Cookies deleted successfully")

  return response
}
