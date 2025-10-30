/**
 * Spotify API Integration
 *
 * To connect this app to Spotify, you'll need to:
 *
 * 1. Create a Spotify Developer App at https://developer.spotify.com/dashboard
 * 2. Add the following environment variables:
 *    - SPOTIFY_CLIENT_ID
 *    - SPOTIFY_CLIENT_SECRET
 *    - SPOTIFY_REDIRECT_URI
 *
 * 3. Implement OAuth flow for user authentication
 * 4. Use the access token to interact with Spotify API
 */

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  uri: string
  preview_url: string | null
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[]
  }
}

/**
 * Get Spotify access token using Client Credentials flow
 */
export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured")
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token")
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Search for a track on Spotify
 */
export async function searchSpotifyTrack(query: string, accessToken: string): Promise<SpotifyTrack | null> {
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    console.error("Failed to search Spotify track:", query)
    return null
  }

  const data: SpotifySearchResponse = await response.json()
  return data.tracks.items[0] || null
}

/**
 * Create a playlist on Spotify (requires user authentication)
 */
export async function createSpotifyPlaylist(
  userId: string,
  name: string,
  description: string,
  trackUris: string[],
  accessToken: string,
): Promise<string> {
  // Create playlist
  const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  })

  if (!createResponse.ok) {
    throw new Error("Failed to create Spotify playlist")
  }

  const playlist = await createResponse.json()

  // Add tracks to playlist
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  })

  return playlist.external_urls.spotify
}
