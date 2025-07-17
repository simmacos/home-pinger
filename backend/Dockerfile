FROM node:18-alpine

WORKDIR /app

# Installa ts-node globalmente
RUN npm install -g ts-node typescript

# Copia package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (incluso dev)
RUN npm ci

# Copia source code
COPY . .

# Crea directory per database
RUN mkdir -p data

# Esponi porta
EXPOSE 3000

# Esegui direttamente con ts-node
CMD ["ts-node", "src/server.ts"]
