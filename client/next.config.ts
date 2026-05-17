import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname),
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["@prisma/client"],
  transpilePackages: ["@midnight-ntwrk/ledger-v8"],
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        "isomorphic-ws": path.resolve(__dirname, "shim/isomorphic-ws.js"),
        "ws": path.resolve(__dirname, "shim/isomorphic-ws.js"),
      },
      fallback: {
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        url: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        child_process: false,
        module: false,
      },
    };
    return config;
  },
};

export default nextConfig;
