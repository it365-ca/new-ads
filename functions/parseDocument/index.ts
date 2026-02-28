import { createClient } from "@lumi.new/sdk"

interface ParseRequest {
  documentSource: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }

  try {
    // Log raw request
    const rawBody = await req.text()
    console.log(JSON.stringify({ stage: "raw_body", body: rawBody, contentType: req.headers.get("Content-Type") }))
    
    // Parse JSON
    let parsedBody: ParseRequest
    try {
      parsedBody = JSON.parse(rawBody)
    } catch (parseError) {
      console.error(JSON.stringify({ stage: "json_parse_error", error: String(parseError), rawBody }))
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      })
    }

    const { documentSource } = parsedBody
    console.log(JSON.stringify({ stage: "parsed", documentSource, hasDocumentSource: Boolean(documentSource) }))

    if (!documentSource) {
      return new Response(JSON.stringify({ error: "documentSource is required" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      })
    }

    // Initialiser le client Lumi
    const projectId = Deno.env.get("PROJECT_ID")
    const apiBaseUrl = Deno.env.get("API_BASE_URL")
    const authOrigin = Deno.env.get("AUTH_ORIGIN")
    const authorization = req.headers.get("Authorization") || ""

    const lumi = createClient({
      projectId,
      apiBaseUrl,
      authOrigin,
      authorization,
    })

    console.log(JSON.stringify({ stage: "start", documentSource, method: req.method }))

    // Parse le document avec Lumi Document Parser
    console.log(JSON.stringify({ stage: "parsing", documentSource }))
    
    const result = await lumi.tools.documentParser.parse({
      documentSource,
      extractMetadata: true
    })

    console.log(JSON.stringify({ 
      stage: "response", 
      contentLength: result.content?.length || 0,
      hasMetadata: Boolean(result.metadata),
      contentPreview: result.content?.substring(0, 100)
    }))

    return new Response(JSON.stringify({ 
      content: result.content,
      metadata: result.metadata
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
  } catch (error) {
    console.error(JSON.stringify({ 
      stage: "error", 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    }))
    return new Response(JSON.stringify({ 
      error: "Failed to parse document",
      details: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
})
