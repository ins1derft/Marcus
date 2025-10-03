import type { NextConfig } from "next";

const assetHost = process.env.NEXT_PUBLIC_ASSET_HOST;
const assetHostUrl = assetHost ? new URL(assetHost) : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: assetHostUrl
      ? [
          {
            protocol: assetHostUrl.protocol.replace(":", ""),
            hostname: assetHostUrl.hostname,
            port: assetHostUrl.port || undefined,
            pathname: "/**",
          },
        ]
      : [],
  },
  env: {
    API_CONTAINER_URL: process.env.API_CONTAINER_URL,
    API_CLIENT_URL: process.env.API_CLIENT_URL,
    API_TOKEN: process.env.API_TOKEN,
    NEXT_PUBLIC_MEILISEARCH_HOST: process.env.NEXT_PUBLIC_MEILISEARCH_HOST,
    NEXT_PUBLIC_MEILISEARCH_API_KEY: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY,
    NEXT_PUBLIC_ASSET_HOST: assetHost,
  },
};

export default nextConfig;
