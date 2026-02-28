const functionName = "getWeather"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405)
    }

    const body = await req.json()
    console.log(JSON.stringify({ stage: "start", functionName, method: req.method, payload: body }))

    const apiKey = Deno.env.get("OPENWEATHER_API_KEY")
    if (!apiKey) {
      console.error(JSON.stringify({ stage: "error", functionName, message: "Missing OPENWEATHER_API_KEY" }))
      return jsonResponse({ error: "Service configuration error: Missing API credentials" }, 500)
    }
    console.log(JSON.stringify({ stage: "config", functionName, key: "OPENWEATHER_API_KEY", configured: true }))

    const { lat, lon } = body
    if (!lat || !lon) {
      return jsonResponse({ error: "Missing required parameters: lat and lon" }, 400)
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`
    console.log(JSON.stringify({ stage: "external_request", functionName, url: weatherUrl.replace(apiKey, "***"), params: { lat, lon } }))
    
    const response = await fetch(weatherUrl)
    console.log(JSON.stringify({ stage: "external_response", functionName, status: response.status }))

    if (response.status === 401 || response.status === 403) {
      return jsonResponse({ error: "Weather API authentication failed: confirm OPENWEATHER_API_KEY is valid" }, 502)
    }

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`)
    }

    const result = await response.json()
    console.log(JSON.stringify({ stage: "response", functionName, payload: result }))
    
    return jsonResponse({ 
      success: true, 
      data: {
        temp: Math.round(result.main.temp),
        condition: result.weather[0].description,
        icon: result.weather[0].icon,
        city: result.name
      }
    })
  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", functionName, message: error.message, stack: error.stack }))
    return jsonResponse({ error: error.message ?? "Internal server error" }, 500)
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(handler)
