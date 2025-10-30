import { PlaylistGenerator } from "@/components/playlist-generator"
import { Music2 } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary rounded-2xl">
              <Music2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance">AI Playlist Generator</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Describe your mood, vibe, or occasion and let AI create the perfect Spotify playlist for you
          </p>
        </div>

        <PlaylistGenerator />

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">Powered by AI and Spotify API</p>
        </div>
      </div>
    </main>
  )
}
