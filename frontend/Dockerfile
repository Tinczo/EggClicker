# --- Etap 1: Budowanie (Builder) ---
# Używamy Node.js, aby zbudować naszą aplikację React
FROM node:lts-alpine AS builder
LABEL stage="builder"

WORKDIR /app

# --- DODAJ TE LINIE (ODBIÓR ARGUMENTÓW) ---
ARG REACT_APP_COGNITO_USER_POOL_ID
ARG REACT_APP_COGNITO_APP_CLIENT_ID
ARG REACT_APP_AWS_REGION

# --- DODAJ TE LINIE (USTAWIENIE ZMIENNYCH ŚRODOWISKOWYCH) ---
ENV REACT_APP_COGNITO_USER_POOL_ID=$REACT_APP_COGNITO_USER_POOL_ID
ENV REACT_APP_COGNITO_APP_CLIENT_ID=$REACT_APP_COGNITO_APP_CLIENT_ID
ENV REACT_APP_AWS_REGION=$REACT_APP_AWS_REGION

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