# Download amplify_outputs.json from the latest build
# This script fetches the amplify_outputs.json from your Amplify deployment

$APP_ID = "d16qyjbt1a9iyw"
$BRANCH = "main"
$REGION = "ap-south-1"

Write-Host "Fetching latest build for app $APP_ID, branch $BRANCH..." -ForegroundColor Cyan

# Get the latest job
$job = aws amplify list-jobs --app-id $APP_ID --branch-name $BRANCH --region $REGION --max-results 1 | ConvertFrom-Json

if ($job.jobSummaries.Count -eq 0) {
    Write-Host "No builds found!" -ForegroundColor Red
    exit 1
}

$latestJob = $job.jobSummaries[0]
Write-Host "Latest build: $($latestJob.jobId) - Status: $($latestJob.status)" -ForegroundColor Green

# Get the artifact URL
$artifacts = aws amplify list-artifacts --app-id $APP_ID --branch-name $BRANCH --job-id $latestJob.jobId --region $REGION | ConvertFrom-Json

Write-Host "`nArtifacts found:" -ForegroundColor Cyan
$artifacts.artifacts | ForEach-Object {
    Write-Host "  - $($_.artifactFileName)" -ForegroundColor Yellow
}

# Look for amplify_outputs.json in the artifacts
$outputsArtifact = $artifacts.artifacts | Where-Object { $_.artifactFileName -like "*amplify_outputs.json*" }

if ($outputsArtifact) {
    Write-Host "`nDownloading amplify_outputs.json..." -ForegroundColor Cyan
    $url = $outputsArtifact.artifactUrl
    Invoke-WebRequest -Uri $url -OutFile ".\amplify_outputs_new.json"
    Write-Host "Downloaded to: amplify_outputs_new.json" -ForegroundColor Green
    Write-Host "`nPlease review the file and then copy it to client/src/amplify_outputs.json" -ForegroundColor Yellow
} else {
    Write-Host "`nCould not find amplify_outputs.json in artifacts." -ForegroundColor Red
    Write-Host "Please download it manually from the Amplify Console." -ForegroundColor Yellow
}
