
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const region = process.env.AWS_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;

// To jest adres "księgi kluczy publicznych" Twojej puli Cognito.
// Każda pula ma taki adres.
const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

// Konfigurujemy naszego "ochroniarza" (middleware)
const checkJwt = jwt({
  // "Ochroniarz" będzie pobierał klucze z naszej księgi (jwksUri)
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: jwksUri
  }),

  // Sprawdź, czy token jest od właściwego "wystawcy" (naszej puli)
  issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,

  // Sprawdź, czy token jest przeznaczony dla nas (naszego App Client ID)
  // UWAGA: Musimy dodać COGNITO_APP_CLIENT_ID do .env!
  audience: process.env.COGNITO_APP_CLIENT_ID, // Zrobimy to za chwilę

  // Używany algorytm podpisu
  algorithms: ['RS256']
});

module.exports = checkJwt;