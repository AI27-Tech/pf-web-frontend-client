/*
 * SolicitarServicioWizard. El contenedor de interaccion del asistente.
 *
 * Posee el borrador (`useReducer`) y el ID de la solicitud enviada, ambos efimeros al
 * flujo.
 */

import { useEffect, useReducer, useRef, useState, type Dispatch } from 'react';
import {
  BORRADOR_INICIAL,
  esBorradorVacio,
  generarIdSolicitud,
  reducerBorrador,
  type AccionBorrador,
} from './borrador';
import {
  PASOS_VISIBLES,
  type CatalogosSolicitud,
  type PasoSolicitud,
  type PasoVisible,
} from './pasos';
import { StepperSolicitud } from './StepperSolicitud';
import { WizardFooter } from './WizardFooter';
import { PasoServicioFecha } from './PasoServicioFecha';
import { PasoRuta } from './PasoRuta';
import { PasoDetalles } from './PasoDetalles';
import { PasoRevisar } from './PasoRevisar';
import { SolicitudEnviada } from './SolicitudEnviada';

interface SolicitarServicioWizardProps {
  readonly paso: PasoSolicitud;
  readonly navegarAPaso: (paso: PasoSolicitud) => void;
  readonly catalogos: CatalogosSolicitud;
}

export function SolicitarServicioWizard({
  paso,
  navegarAPaso,
  catalogos: _catalogos,
}: SolicitarServicioWizardProps) {
  const [borrador, dispatch] = useReducer(reducerBorrador, BORRADOR_INICIAL);
  const [idEnviado, setIdEnviado] = useState<string | null>(null);

  /*
   * El borrador vive en memoria, asi que una recarga lo pierde.
   */
  const flujoIniciado = useRef(false);

  function irAlPaso(destino: PasoSolicitud): void {
    flujoIniciado.current = true;
    navegarAPaso(destino);
  }

  /*
   * Redireccion en frio: si caemos en un paso avanzado sin haber recorrido el flujo
   * (recarga o enlace directo), volvemos al primero.
   */
  useEffect(() => {
    if (flujoIniciado.current) return;
    const enPasoAvanzado = paso !== 'servicio' && esBorradorVacio(borrador);
    const confirmacionSinId = paso === 'enviada' && idEnviado === null;
    if (enPasoAvanzado || confirmacionSinId) {
      navegarAPaso('servicio');
    }
  }, [paso, borrador, idEnviado, navegarAPaso]);

  const indiceActual = PASOS_VISIBLES.indexOf(paso as PasoVisible);

  function continuar(): void {
    const siguiente = PASOS_VISIBLES[indiceActual + 1];
    if (siguiente !== undefined) irAlPaso(siguiente);
    else irAlPaso('revisar');
  }

  function regresar(): void {
    const anterior = PASOS_VISIBLES[indiceActual - 1];
    if (anterior !== undefined) irAlPaso(anterior);
  }

  function enviar(): void {
    // Sin backend: no hay POST. Solo un acuse con ID simulado y la pantalla final.
    setIdEnviado(generarIdSolicitud());
    irAlPaso('enviada');
  }

  function volverAlInicio(): void {
    dispatch({ tipo: 'reiniciar' });
    setIdEnviado(null);
    irAlPaso('servicio');
  }

  // La confirmacion no lleva stepper ni pie: es una pantalla de cierre.
  if (paso === 'enviada') {
    if (idEnviado === null) return null;
    return (
      <SolicitudEnviada id={idEnviado} borrador={borrador} onVolverAlInicio={volverAlInicio} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StepperSolicitud pasoActual={paso} />
      {paso === 'revisar' ? (
        <PasoRevisar
          borrador={borrador}
          catalogos={_catalogos}
          onEditar={irAlPaso}
          onRegresar={regresar}
          onEnviar={enviar}
        />
      ) : (
        <>
          <PasoActual paso={paso} borrador={borrador} dispatch={dispatch} catalogos={_catalogos} />
          <WizardFooter
            {...(indiceActual > 0 ? { onRegresar: regresar } : {})}
            onContinuar={continuar}
          />
        </>
      )}
    </div>
  );
}

function PasoActual({
  paso,
  borrador,
  dispatch,
  catalogos,
}: {
  readonly paso: PasoVisible;
  readonly borrador: ReturnType<typeof reducerBorrador>;
  readonly dispatch: Dispatch<AccionBorrador>;
  readonly catalogos: CatalogosSolicitud;
}) {
  switch (paso) {
    case 'servicio':
      return (
        <PasoServicioFecha
          datos={borrador.servicio}
          tiposServicio={catalogos.tiposServicio}
          prioridades={catalogos.prioridades}
          dispatch={dispatch}
        />
      );
    case 'ruta':
      return <PasoRuta origen={borrador.origen} destino={borrador.destino} dispatch={dispatch} />;
    case 'detalles':
      return (
        <PasoDetalles
          carga={borrador.carga}
          documentacionComentarios={borrador.documentacion.comentarios}
          categorias={catalogos.categorias}
          rangosValor={catalogos.rangosValor}
          requisitos={catalogos.requisitos}
          dispatch={dispatch}
        />
      );
    default:
      return (
        <div className="bg-surface-container-lowest border-outline-variant text-on-surface-variant rounded-lg border p-6">
          Paso «{paso}» en construcción.
        </div>
      );
  }
}
