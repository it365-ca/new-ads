# API Information

Function URL: `https://api.lumi.new/v1/functions/p384255179950706688/getWeather`

## Request

**Method**: POST

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "lat": 45.508888,
  "lon": -73.561668
}
```

## Response

**Success (200)**:
```json
{
  "success": true,
  "data": {
    "temp": 0,
    "condition": "couvert",
    "icon": "04d",
    "city": "Delson"
  }
}
```

**Error (400/500/502)**:
```json
{
  "error": "Error message"
}
```

## Usage Example (cURL)

```bash
curl -X POST "https://api.lumi.new/v1/functions/p384255179950706688/getWeather" \
  -H "Content-Type: application/json" \
  -d '{"lat": 45.508888, "lon": -73.561668}'
```

## External API

- **Provider**: OpenWeatherMap
- **Endpoint**: https://api.openweathermap.org/data/2.5/weather
- **Documentation**: https://openweathermap.org/current
- **Environment Variable**: `OPENWEATHER_API_KEY`
