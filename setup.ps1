$ErrorActionPreference = "Stop"

Write-Host "Initializing Backend..."
if (!(Test-Path "backend")) { New-Item -ItemType Directory -Path "backend" }
Set-Location "backend"
npm init -y
npm install express cors dotenv jsonwebtoken bcrypt prisma @prisma/client
npm install -D typescript ts-node @types/node @types/express @types/cors @types/jsonwebtoken @types/bcrypt
npx --yes tsc --init
npx --yes prisma init

Set-Location ..

Write-Host "Initializing Frontend..."
npm create vite@latest frontend --yes -- --template react-ts
Set-Location "frontend"
npm install
npm install react-router-dom lucide-react axios framer-motion clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
npx --yes tailwindcss init -p

Set-Location ..
Write-Host "Done"
