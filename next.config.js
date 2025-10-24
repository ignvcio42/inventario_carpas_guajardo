/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir canvas, konva y dependencias de pdfkit del bundle del servidor
      config.externals = [...(config.externals || []), 'canvas', 'konva', 'pdfkit'];
    }
    
    // Resolver módulos de Node.js para el navegador
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    return config;
  },
};

export default config;
