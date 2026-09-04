/// <reference types="vite/client" />

declare module '*.json?runtime' {
  const value: unknown;
  export default value;
}
