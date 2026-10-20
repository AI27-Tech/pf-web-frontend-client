/*
 * Campos de una ubicacion (origen o destino). Es el mismo formulario para las dos, asi
 * que vive una sola vez y se instancia dos veces con distinta seccion del borrador.
 * `onCampo` recibe el nombre del campo tipado, para que el llamador decida a que
 * seccion (`origen`/`destino`) despacha.
 */

import type { DatosUbicacion } from './tipos';
import { FormField, Input, Textarea } from '@ai27-tech/ui';

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
      <FormField label="Nombre del lugar o empresa *">
        <Input
          value={datos.nombreLugar}
          onChange={(event) => onField('nombreLugar', event.target.value)}
          placeholder={examples.nombreLugar}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Calle y número *">
          <Input
            value={datos.calleNumero}
            onChange={(event) => onField('calleNumero', event.target.value)}
            placeholder={examples.calleNumero}
          />
        </FormField>
        <FormField label="Ciudad y Estado *">
          <Input
            value={datos.ciudadEstado}
            onChange={(event) => onField('ciudadEstado', event.target.value)}
            placeholder={examples.ciudadEstado}
          />
        </FormField>
        <FormField label="Código Postal *">
          <Input
            value={datos.codigoPostal}
            onChange={(event) => onField('codigoPostal', event.target.value)}
            placeholder={examples.codigoPostal}
          />
        </FormField>
        <FormField label="Contacto en sitio">
          <Input
            value={datos.contactoSitio}
            onChange={(event) => onField('contactoSitio', event.target.value)}
            placeholder="Nombre completo"
          />
        </FormField>
      </div>
      <FormField label="Teléfono de contacto">
        <Input
          value={datos.telefonoContacto}
          onChange={(event) => onField('telefonoContacto', event.target.value)}
          placeholder="(00) 0000 0000"
        />
      </FormField>
      <FormField label="Instrucciones de acceso">
        <Textarea
          value={datos.instruccionesAcceso}
          onChange={(event) => onField('instruccionesAcceso', event.target.value)}
          placeholder={examples.instruccionesAcceso}
        />
      </FormField>
    </div>
  );
}
