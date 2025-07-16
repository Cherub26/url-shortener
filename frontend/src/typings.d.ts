interface ImportMetaEnv {
  readonly NG_APP_BACKEND_PORT?: string;
  readonly NG_APP_BACKEND_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 