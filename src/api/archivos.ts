/**
 * Cuerpo multipart/form-data con el campo `archivo` (guía §6), para openapi-fetch:
 * api.PUT(ruta, { params, body: { archivo }, bodySerializer: comoFormulario }).
 */
export function comoFormulario(cuerpo: { archivo: Blob }): FormData {
  const formulario = new FormData();
  formulario.append("archivo", cuerpo.archivo);
  return formulario;
}
