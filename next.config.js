/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  webpack: (config, { isServer }) => {
    // Excluir canvas y konva del bundle del servidor
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'konva'];
    }
    return config;
  },
};

export default config;
