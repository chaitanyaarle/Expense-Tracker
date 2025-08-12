# Build and prepare for deployment
npm run build

# Create a deployment directory
if (Test-Path "deploy") { Remove-Item -Recurse -Force "deploy" }
New-Item -ItemType Directory -Path "deploy"

# Copy necessary files
Copy-Item "server.js" "deploy/"
Copy-Item "package.json" "deploy/"
Copy-Item -Recurse "dist" "deploy/"

Write-Host "Deployment package ready in 'deploy' folder"
Write-Host "Upload the contents of the 'deploy' folder to Azure App Service"
