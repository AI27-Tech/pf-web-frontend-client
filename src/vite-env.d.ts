/// <reference types="vite/client" />

/*
 * Declarar las variables aqui no es cosmetico: permite ACCESO POR PUNTO
 * (`import.meta.env.VITE_ENABLE_MOCKS`), y eso es lo unico que Vite sustituye de forma
 * estatica en el bundle.
 *
 * Con acceso por corchetes —`import.meta.env['VITE_ENABLE_MOCKS']`— la sustitucion no
 * ocurre, la condicion no se puede plegar en tiempo de compilacion, y un
 * `await import('@/mocks/start')` dentro de ese `if` acaba emitido como chunk incluso
 * en el build de produccion. Es decir: el backend simulado viajaria en el bundle real.
 */

interface ImportMetaEnv {
  /** Base URL de `bff`. Vacio = mismo origen. */
  readonly VITE_API_BASE_URL?: string;
  /** `'true'` activa el bff simulado de src/mocks/. */
  readonly VITE_ENABLE_MOCKS?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
