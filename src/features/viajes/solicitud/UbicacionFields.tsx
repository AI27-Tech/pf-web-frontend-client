/*
 * Campos de una ubicacion (origen o destino). Es el mismo formulario para las dos, asi
 * que vive una sola vez y se instancia dos veces con distinta seccion del borrador.
 * `onCampo` recibe el nombre del campo tipado, para que el llamador decida a que
 * seccion (`origen`/`destino`) despacha.
 */

import type { DatosUbicacion } from '@/lib/contracts';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface UbicacionFieldsProps {
  readonly datos: DatosUbicacion;
  readonly onCampo: (campo: keyof DatosUbicacion, valor: string) => void;
  /** Ejemplos de placeholder que cambian entre origen y destino. */
  readonly ejemplos: {
    readonly nombreLugar: string;
    readonly calleNumero: string;
    readonly ciudadEstado: string;
    readonly codigoPostal: string;
    readonly instruccionesAcceso: string;
  };
}

export function UbicacionFields({ datos, onCampo, ejemplos }: UbicacionFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Nombre del lugar o empresa *"
        value={datos.nombreLugar}
        onChange={(evento) => onCampo('nombreLugar', evento.target.value)}
        placeholder={ejemplos.nombreLugar}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Calle y número *"
          value={datos.calleNumero}
          onChange={(evento) => onCampo('calleNumero', evento.target.value)}
          placeholder={ejemplos.calleNumero}
        />
        <Input
          label="Ciudad y Estado *"
          value={datos.ciudadEstado}
          onChange={(evento) => onCampo('ciudadEstado', evento.target.value)}
          placeholder={ejemplos.ciudadEstado}
        />
        <Input
          label="Código Postal *"
          value={datos.codigoPostal}
          onChange={(evento) => onCampo('codigoPostal', evento.target.value)}
          placeholder={ejemplos.codigoPostal}
        />
        <Input
          label="Contacto en sitio"
          value={datos.contactoSitio}
          onChange={(evento) => onCampo('contactoSitio', evento.target.value)}
          placeholder="Nombre completo"
        />
      </div>
      <Input
        label="Teléfono de contacto"
        value={datos.telefonoContacto}
        onChange={(evento) => onCampo('telefonoContacto', evento.target.value)}
        placeholder="(00) 0000 0000"
      />
      <Textarea
        label="Instrucciones de acceso"
        value={datos.instruccionesAcceso}
        onChange={(evento) => onCampo('instruccionesAcceso', evento.target.value)}
        placeholder={ejemplos.instruccionesAcceso}
      />
    </div>
  );
}
