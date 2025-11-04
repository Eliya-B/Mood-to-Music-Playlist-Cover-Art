import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()

  const allCookies = cookieStore.getAll()
  console.log(
    "[v0] Status - All cookies:",
    allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
  )

  const accessToken = cookieStore.get("spotify_access_token")

  console.log("[v0] Status - Access token exists:", !!accessToken)
  console.log("[v0] Status - Access token value length:", accessToken?.value?.length || 0)

  return Response.json(
    {
      authenticated: !!accessToken,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  )
}
