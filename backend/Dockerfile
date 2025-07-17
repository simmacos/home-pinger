FROM node:18-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm ci --only=production

# Copia codice sorgente
COPY . .

# Compila TypeScript
RUN npm run build

# Crea directory per database
RUN mkdir -p data

# Esponi porta
EXPOSE 3000

# Avvia applicazione
CMD ["npm", "start"]
