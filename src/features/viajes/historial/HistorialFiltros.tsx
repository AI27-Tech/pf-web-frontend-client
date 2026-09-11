/*
 * HistorialFiltros: la barra de filtros del Historial de Viajes.
 *
 * SOLO FRONTEND. Los campos son usables —se puede escribir y elegir, y el valor se
 * conserva— pero no filtran nada: el estado vive aqui y no toca ni la URL ni los
 * datos. El boton "Filtrar" esta deshabilitado a proposito, con su motivo en el
 * `title`, en vez de fingir una accion que todavia no existe.
 *
 * TODO(contracts): el filtrado es del servidor. Cuando exista el contrato, estos
 * campos alimentaran un search param de la ruta (patron de `login.tsx`) que el loader
 * leera con `loaderDeps` para pedir a bff la pagina ya filtrada. No se filtra en
 * cliente: la lista completa no vive en el navegador.
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CampoFiltro } from './CampoFiltro';

/** Motivo del `title` del boton, para no repetirlo. */
const MOTIVO_SIN_FILTRO = 'El filtrado se hara en el servidor (pendiente de contrato)';

const claseControl =
  'bg-surface-container-lowest border-outline text-on-surface w-full rounded-lg border px-3 py-2.5 text-sm ' +
  'placeholder:text-on-surface-variant focus:border-primary focus:outline-none';

export function HistorialFiltros() {
  // Estado local: los valores se conservan al escribir/elegir, pero no filtran nada.
  const [rango, setRango] = useState('30d');
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  return (
    <form
      // Sin filtrado real: se evita que un Enter recargue la pagina.
      onSubmit={(evento) => evento.preventDefault()}
      className="bg-surface-container-lowest border-outline-variant flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-end"
    >
      <div className="lg:w-56">
        <CampoFiltro label="Rango de fechas">
          {(id) => (
            <select
              id={id}
              value={rango}
              onChange={(evento) => setRango(evento.target.value)}
              className={claseControl}
            >
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="90d">Ultimos 90 dias</option>
            </select>
          )}
        </CampoFiltro>
      </div>

      <div className="lg:w-56">
        <CampoFiltro label="Estado">
          {(id) => (
            <select
              id={id}
              value={estado}
              onChange={(evento) => setEstado(evento.target.value)}
              className={claseControl}
            >
              <option value="">Todos los estados</option>
              <option value="EN_RUTA">En Ruta</option>
              <option value="SOLICITADO">Solicitado</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          )}
        </CampoFiltro>
      </div>

      <div className="flex-1">
        <CampoFiltro
          label="Busqueda rapida"
          icono={<Search aria-hidden="true" className="size-4" />}
        >
          {(id) => (
            <input
              id={id}
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por ID de Vehiculo, Origen o Destino..."
              className={`${claseControl} pl-10`}
            />
          )}
        </CampoFiltro>
      </div>

      <Button type="submit" variant="secondary" disabled title={MOTIVO_SIN_FILTRO}>
        Filtrar
      </Button>
    </form>
  );
}
