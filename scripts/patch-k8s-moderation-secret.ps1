$ErrorActionPreference = "Stop"

function Read-EnvFile($path) {
  $result = @{}

  if (!(Test-Path -LiteralPath $path)) {
    return $result
  }

  foreach ($line in Get-Content -LiteralPath $path) {
    $trimmed = $line.Trim()

    if (!$trimmed -or $trimmed.StartsWith("#") -or !$trimmed.Contains("=")) {
      continue
    }

    $idx = $trimmed.IndexOf("=")
    $key = $trimmed.Substring(0, $idx).Trim()
    $value = $trimmed.Substring($idx + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $result[$key] = $value
  }

  return $result
}

$quoteEnv = Read-EnvFile ".\services\quote-service\.env"
$aiEnv = Read-EnvFile ".\services\ai-service\.env"

$keys = @(
  "AZURE_CONTENT_SAFETY_ENDPOINT",
  "AZURE_CONTENT_SAFETY_KEY",
  "CONTENT_SAFETY_BLOCK_SEVERITY",
  "AZURE_FOUNDRY_PROJECT_ENDPOINT",
  "AZURE_FOUNDRY_API_KEY",
  "AZURE_FOUNDRY_MODEL"
)

$data = @{}

foreach ($key in $keys) {
  $value = $null

  if ($quoteEnv.ContainsKey($key) -and $quoteEnv[$key]) {
    $value = $quoteEnv[$key]
  } elseif ($aiEnv.ContainsKey($key) -and $aiEnv[$key]) {
    $value = $aiEnv[$key]
  }

  if ($null -ne $value) {
    $data[$key] = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($value))
  }
}

if ($data.Count -eq 0) {
  throw "No moderation env values found to patch."
}

$patchPath = ".\scripts\.k8s-secret-patch.json"

try {
  @{ data = $data } | ConvertTo-Json -Depth 5 -Compress | Set-Content -LiteralPath $patchPath -NoNewline
  kubectl patch secret gerrys-docks-secrets --type merge --patch-file $patchPath
} finally {
  if (Test-Path -LiteralPath $patchPath) {
    [System.IO.File]::Delete((Resolve-Path -LiteralPath $patchPath))
  }
}

kubectl rollout restart deployment quote-service
kubectl rollout restart deployment ai-service
kubectl rollout status deployment quote-service --timeout=120s
kubectl rollout status deployment ai-service --timeout=120s
