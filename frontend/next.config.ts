import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const assetHost = process.env.NEXT_PUBLIC_ASSET_HOST;
const assetHostUrl = assetHost ? new URL(assetHost) : null;

const remotePatterns: RemotePattern[] = [];

if (assetHostUrl) {
  const pattern: RemotePattern = {
    hostname: assetHostUrl.hostname,
    pathname: "/**",
  };

  const protocol = assetHostUrl.protocol.replace(":", "");
  if (protocol === "http" || protocol === "https") {
    pattern.protocol = protocol;
  }

  if (assetHostUrl.port) {
    pattern.port = assetHostUrl.port;
  }

  remotePatterns.push(pattern);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
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
