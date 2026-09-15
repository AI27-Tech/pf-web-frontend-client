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
  readonly onField: (field: keyof DatosUbicacion, value: string) => void;
  /** Ejemplos de placeholder que cambian entre origen y destino. */
  readonly examples: {
    readonly nombreLugar: string;
    readonly calleNumero: string;
    readonly ciudadEstado: string;
    readonly codigoPostal: string;
    readonly instruccionesAcceso: string;
  };
}

export function UbicacionFields({ datos, onField, examples }: UbicacionFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Nombre del lugar o empresa *"
        value={datos.nombreLugar}
        onChange={(event) => onField('nombreLugar', event.target.value)}
        placeholder={examples.nombreLugar}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Calle y número *"
          value={datos.calleNumero}
          onChange={(event) => onField('calleNumero', event.target.value)}
          placeholder={examples.calleNumero}
        />
        <Input
          label="Ciudad y Estado *"
          value={datos.ciudadEstado}
          onChange={(event) => onField('ciudadEstado', event.target.value)}
          placeholder={examples.ciudadEstado}
        />
        <Input
          label="Código Postal *"
          value={datos.codigoPostal}
          onChange={(event) => onField('codigoPostal', event.target.value)}
          placeholder={examples.codigoPostal}
        />
        <Input
          label="Contacto en sitio"
          value={datos.contactoSitio}
          onChange={(event) => onField('contactoSitio', event.target.value)}
          placeholder="Nombre completo"
        />
      </div>
      <Input
        label="Teléfono de contacto"
        value={datos.telefonoContacto}
        onChange={(event) => onField('telefonoContacto', event.target.value)}
        placeholder="(00) 0000 0000"
      />
      <Textarea
        label="Instrucciones de acceso"
        value={datos.instruccionesAcceso}
        onChange={(event) => onField('instruccionesAcceso', event.target.value)}
        placeholder={examples.instruccionesAcceso}
      />
    </div>
  );
}
