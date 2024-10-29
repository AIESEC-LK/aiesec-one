interface Environment {
  accessTokenSecret: string;
  accessTokenExpiration: string;
}

export const environment: Environment = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "fall back",
  accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION ?? "24h"
};
