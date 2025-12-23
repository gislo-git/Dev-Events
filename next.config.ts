import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler:true,
  experimental:{
    turbopackFileSystemCacheForDev:true
  }
  /* config options here */
};

export default nextConfig;
