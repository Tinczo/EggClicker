# --- Etap 1: Budowanie (Builder) ---
# Używamy Node.js, aby zbudować naszą aplikację React
FROM node:lts-alpine AS builder
LABEL stage="builder"

WORKDIR /app

# Kopiujemy pliki manifestu
COPY package*.json ./

# Instalujemy wszystkie zależności (w tym deweloperskie, potrzebne do budowania)
RUN npm install

# Kopiujemy resztę kodu
COPY . .

# Kluczowy krok: Budujemy wersję produkcyjną aplikacji
RUN npm run build

# --- Etap 2: Produkcja (Production) ---
# Zaczynamy od nowa z super lekkim serwerem Nginx
FROM nginx:stable-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopiujemy *tylko* gotowe, zbudowane pliki z etapu 1
# do folderu, z którego Nginx serwuje strony
COPY --from=builder /app/build /usr/share/nginx/html

# Informujemy Dockera, że Nginx nasłuchuje na porcie 80
EXPOSE 80

# Domyślna komenda startowa dla Nginx
CMD ["nginx", "-g", "daemon off;"]