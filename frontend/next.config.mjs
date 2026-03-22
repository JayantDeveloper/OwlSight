/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Stub optional wagmi connector peer deps that are not installed
    config.resolve.alias = {
      ...config.resolve.alias,
      "@coinbase/wallet-sdk": false,
      "@metamask/sdk": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@base-org/account": false,
      "porto/internal": false,
      "@walletconnect/ethereum-provider": false,
    };
    return config;
  },
};

export default nextConfig;

