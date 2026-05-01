// Environment type declarations for OpenCode plugins
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Add any environment variables your plugin needs
       "CONTEXT7_API_KEY": string
    }
  }
}

export {}
