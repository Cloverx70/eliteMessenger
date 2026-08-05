import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "elitemessenger.s3.eu-north-1.amazonaws.com",
      "api.dicebear.com",
      "lh3.googleusercontent.com",
    ],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
