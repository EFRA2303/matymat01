#!/bin/bash
echo "🔧 Instalando dependencias..."
npm install

echo "📦 Verificando instalación..."
npm list --depth=0

echo "🚀 Iniciando servidor..."
node server.js
