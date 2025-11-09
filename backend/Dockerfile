# --- Etap 1: Budowanie (Builder) ---
# Używamy oficjalnego obrazu Node.js jako bazy
FROM node:lts-alpine AS builder
LABEL stage="builder"

# Ustawiamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy pliki manifestu zależności
COPY package*.json ./

# Instalujemy zależności (tylko produkcyjne, żeby było szybciej i lżej)
RUN npm install --only=production

# Kopiujemy resztę kodu źródłowego
COPY ./src ./src

# --- Etap 2: Produkcja (Production) ---
# Zaczynamy od nowa z czystym, lekkim obrazem
FROM node:lts-alpine AS production

WORKDIR /app

# Kopiujemy zależności i kod z etapu "builder"
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Informujemy Dockera, że nasza aplikacja działa na porcie 3001
EXPOSE 3001

# Komenda, która zostanie uruchomiona po starcie kontenera
CMD [ "node", "src/index.js" ]