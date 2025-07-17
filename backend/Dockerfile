FROM node:18-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copia source code
COPY . .

# Compila TypeScript
RUN npm run build

# Crea directory per database
RUN mkdir -p data

# Esponi porta
EXPOSE 3000

# Avvia con supporto ES Module
CMD ["node", "--experimental-modules", "dist/server.js"]
