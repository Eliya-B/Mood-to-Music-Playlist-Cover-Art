import { generateObject } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"

export const maxDuration = 30

console.log("[v0] Groq API Key exists:", !!process.env.API_KEY_GROQ_API_KEY)

const groq = createGroq({
  apiKey: process.env.API_KEY_GROQ_API_KEY,
})

// Schema for the AI to generate playlist recommendations
const playlistSchema = z.object({
  playlistName: z.string().describe("A creative name for the playlist"),
  playlistDescription: z.string().describe("A brief description of the playlist vibe"),
  tracks: z
    .array(
      z.object({
        name: z.string().describe("Song title"),
        artist: z.string().describe("Artist name"),
      }),
    )
    .min(10)
    .max(30)
    .describe("Array of 15-25 song recommendations"),
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    console.log("[v0] Received playlist generation request with prompt:", prompt)

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Invalid prompt provided" }, { status: 400 })
    }

    console.log("[v0] Calling Groq API with model: openai/gpt-oss-120b")

    const { object } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: playlistSchema,
      prompt: `You are a music expert and playlist curator. Based on the user's request, create a playlist with 15-25 songs that perfectly match their mood, activity, or preferences.

User request: "${prompt}"

Generate a diverse playlist with real, popular songs that fit the request. Include a mix of well-known tracks and some hidden gems. Make sure the playlist flows well and matches the vibe described.`,
      maxOutputTokens: 2000,
    })

    console.log("[v0] Successfully generated playlist:", object.playlistName)
    console.log("[v0] Number of tracks:", object.tracks.length)

    return Response.json({
      playlistName: object.playlistName,
      playlistDescription: object.playlistDescription,
      tracks: object.tracks,
    })
  } catch (error) {
    console.error("[v0] Error generating playlist:", error)
    console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return Response.json({ error: "Groq API key is missing or invalid" }, { status: 500 })
      }
      if (error.message.includes("model")) {
        return Response.json({ error: "Invalid model configuration" }, { status: 500 })
      }
      if (error.message.includes("rate limit")) {
        return Response.json({ error: "API rate limit exceeded. Please try again later." }, { status: 429 })
      }
    }

    return Response.json({ error: "Failed to generate playlist. Please try again." }, { status: 500 })
  }
}
