"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Music, Sparkles, ExternalLink, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Track {
  name: string
  artist: string
  uri?: string
  preview_url?: string
}

interface PlaylistResult {
  tracks: Track[]
  playlistName: string
  playlistDescription: string
  spotifyUrl?: string
}

export function PlaylistGenerator() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PlaylistResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/spotify/status")
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      console.error("Failed to check auth status:", error)
    }
  }

  const handleSpotifyLogin = () => {
    window.location.href = "/api/auth/spotify"
  }

  const handleSpotifyLogout = async () => {
    try {
      await fetch("/api/auth/spotify/logout", { method: "POST" })
      setIsAuthenticated(false)
      setResult(null)
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/generate-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate playlist")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSpotifyPlaylist = async () => {
    if (!result || !isAuthenticated) return

    setCreatingPlaylist(true)
    setError(null)

    try {
      const response = await fetch("/api/create-spotify-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistName: result.playlistName,
          playlistDescription: result.playlistDescription,
          tracks: result.tracks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create playlist")
      }

      const data = await response.json()

      // Update result with the actual Spotify playlist URL
      setResult({
        ...result,
        spotifyUrl: data.playlistUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create Spotify playlist")
    } finally {
      setCreatingPlaylist(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 shadow-lg bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{isAuthenticated ? "✓ Connected to Spotify" : "Connect to Spotify"}</p>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated
                  ? "You can now create public playlists"
                  : "Log in to create and save playlists to your Spotify account"}
              </p>
            </div>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={handleSpotifyLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleSpotifyLogin} className="bg-[#1DB954] hover:bg-[#1ed760] text-white">
                <Music className="w-4 h-4 mr-2" />
                Connect Spotify
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Describe Your Perfect Playlist
          </CardTitle>
          <CardDescription>
            Tell us about your mood, activity, genre preferences, or any specific vibe you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Upbeat indie rock for a road trip, chill lo-fi beats for studying, energetic workout music, romantic jazz for dinner..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 resize-none text-base"
            disabled={loading}
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Your Playlist...
              </>
            ) : (
              <>
                <Music className="w-5 h-5 mr-2" />
                Generate Playlist
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="border-2 shadow-lg bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{result.playlistName}</CardTitle>
                <CardDescription className="text-base">{result.playlistDescription}</CardDescription>
              </div>
              <div className="flex gap-2">
                {result.spotifyUrl ? (
                  <Button variant="default" size="sm" asChild className="bg-[#1DB954] hover:bg-[#1ed760]">
                    <a href={result.spotifyUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Spotify
                    </a>
                  </Button>
                ) : isAuthenticated ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCreateSpotifyPlaylist}
                    disabled={creatingPlaylist}
                    className="bg-[#1DB954] hover:bg-[#1ed760]"
                  >
                    {creatingPlaylist ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Music className="w-4 h-4 mr-2" />
                        Create Playlist
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleSpotifyLogin}>
                    <Music className="w-4 h-4 mr-2" />
                    Connect to Create
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {result.tracks.length} Tracks
              </h3>
              <div className="space-y-2">
                {result.tracks.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
