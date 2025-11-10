FROM node:lts-alpine AS builder

LABEL stage="builder"

WORKDIR /app

ARG REACT_APP_COGNITO_USER_POOL_ID
ARG REACT_APP_COGNITO_APP_CLIENT_ID
ARG REACT_APP_AWS_REGION

ENV REACT_APP_COGNITO_USER_POOL_ID=$REACT_APP_COGNITO_USER_POOL_ID
ENV REACT_APP_COGNITO_APP_CLIENT_ID=$REACT_APP_COGNITO_APP_CLIENT_ID
ENV REACT_APP_AWS_REGION=$REACT_APP_AWS_REGION

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]