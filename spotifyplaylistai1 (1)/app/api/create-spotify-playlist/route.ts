import { cookies } from "next/headers"
import { searchSpotifyTrack } from "@/lib/spotify"

export const maxDuration = 30

interface Track {
  name: string
  artist: string
}

export async function POST(req: Request) {
  try {
    const { playlistName, playlistDescription, tracks } = await req.json()

    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value

    if (!accessToken) {
      return Response.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    // Get user profile
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      return Response.json({ error: "Failed to get Spotify user profile" }, { status: 401 })
    }

    const profile = await profileResponse.json()

    // Search for tracks on Spotify
    const trackUris: string[] = []
    for (const track of tracks as Track[]) {
      const spotifyTrack = await searchSpotifyTrack(`${track.name} ${track.artist}`, accessToken)
      if (spotifyTrack?.uri) {
        trackUris.push(spotifyTrack.uri)
      }
    }

    if (trackUris.length === 0) {
      return Response.json({ error: "No tracks found on Spotify" }, { status: 400 })
    }

    // Create playlist
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${profile.id}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: true, // Make it public so it's shareable
      }),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json()
      console.error("Failed to create playlist:", errorData)
      return Response.json({ error: "Failed to create Spotify playlist" }, { status: 500 })
    }

    const playlist = await createResponse.json()

    // Add tracks to playlist
    const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    })

    if (!addTracksResponse.ok) {
      console.error("Failed to add tracks to playlist")
      return Response.json({ error: "Failed to add tracks to playlist" }, { status: 500 })
    }

    return Response.json({
      success: true,
      playlistUrl: playlist.external_urls.spotify,
      playlistId: playlist.id,
      tracksAdded: trackUris.length,
    })
  } catch (error) {
    console.error("Error creating Spotify playlist:", error)
    return Response.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
