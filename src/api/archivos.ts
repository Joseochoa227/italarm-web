/**
 * Cuerpo multipart/form-data con el campo `archivo` (guía §6), para openapi-fetch:
 * api.PUT(ruta, { params, body: { archivo }, bodySerializer: comoFormulario }).
 * El contrato no marca el cuerpo como obligatorio, por eso acepta undefined.
 */
export function comoFormulario(cuerpo: { archivo: Blob } | undefined): FormData {
  const formulario = new FormData();
  if (cuerpo) formulario.append("archivo", cuerpo.archivo);
  return formulario;
}
