#!/usr/bin/env node
/*
 * Genera los tipos de la API a partir del contrato autoritativo del backend.
 *
 * ESTADO: BLOQUEADO. El contrato no existe todavia en este workspace — no hay
 * repo backend clonado ni remoto configurado, asi que contracts/openapi/bff.yaml,
 * contracts/events/ y contracts/estados/ no estan en ninguna parte.
 *
 * Mientras eso siga asi, src/lib/contracts/ contiene tipos PROVISIONALES escritos
 * a mano desde docs/arquitectura/. Este script existe para que el dia que el
 * contrato aparezca, el reemplazo sea un comando y no una arqueologia.
 *
 * Uso:
 *   CONTRACTS_DIR=/ruta/al/backend/contracts pnpm gen:contracts
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const contractsDir = process.env.CONTRACTS_DIR;

if (!contractsDir) {
  console.error(`
[gen:contracts] BLOQUEADO — no hay contrato del que generar.

  CONTRACTS_DIR no esta definido, y este repo no contiene el contrato del backend.

  Que hace falta:
    contracts/openapi/bff.yaml   -> tipos de la superficie HTTP
    contracts/events/            -> tipos del sobre SSE
    contracts/estados/           -> enum de estados de viaje

  Cuando exista:
    CONTRACTS_DIR=/ruta/al/backend/contracts pnpm gen:contracts

  Hasta entonces, src/lib/contracts/ lleva tipos provisionales escritos a mano.
  Cada archivo esta marcado con PROVISIONAL en su cabecera. No los des por buenos.
`);
  process.exit(1);
}

const openapiPath = resolve(join(contractsDir, 'openapi', 'bff.yaml'));

if (!existsSync(openapiPath)) {
  console.error(`[gen:contracts] No se encontro el contrato en ${openapiPath}`);
  process.exit(1);
}

const outPath = resolve('src/lib/api/generated/bff.ts');

console.log(`[gen:contracts] ${openapiPath} -> ${outPath}`);

const result = spawnSync(
  'pnpm',
  ['exec', 'openapi-typescript', openapiPath, '--output', outPath, '--root-types'],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
