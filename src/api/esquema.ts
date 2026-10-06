// Archivo generado con `npm run api:generar` desde contrato/openapi.json. No se edita a mano.

export interface paths {
    "/api/v1/ajustes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de ajustes
         * @description Orden por defecto: más recientes primero.
         */
        get: operations["listar_8"];
        put?: never;
        /**
         * Registrar un ajuste de entrada (cantidad positiva) o de salida (negativa)
         * @description La entrada entra al costo vigente; si el producto nunca tuvo costo, exige costoUnitarioUsd. Con la misma Idempotency-Key devuelve el ajuste ya creado. Errores (400): AJUSTE_INVALIDO, COSTO_REQUERIDO, CANTIDAD_INVALIDA, SERIALES_NO_COINCIDEN, PRODUCTO_NO_EXISTE; (409) SERIAL_DUPLICADO; (422) STOCK_INSUFICIENTE, SERIAL_NO_DISPONIBLE.
         */
        post: operations["registrar_5"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ajustes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de un ajuste */
        get: operations["detalle_9"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/archivos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Descargar un archivo con un enlace firmado */
        get: operations["descargar_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/carga-inicial": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Cargas realizadas, de la más reciente a la más antigua */
        get: operations["listar_7"];
        put?: never;
        /**
         * Guardar la carga si el archivo no tiene errores
         * @description Crea los productos, clientes y proveedores y el documento II-00N. Con un solo error no guarda nada: CARGA_INICIAL_CON_ERRORES (400) con la lista en 'errores'. Además: ARCHIVO_TIPO_NO_PERMITIDO, ARCHIVO_DEMASIADO_GRANDE (400).
         */
        post: operations["confirmar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/carga-inicial/plantilla": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Descargar la plantilla .xlsx */
        get: operations["plantilla"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/carga-inicial/validar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revisar el archivo sin guardar nada
         * @description Devuelve los errores por hoja y fila y un resumen. Errores: ARCHIVO_TIPO_NO_PERMITIDO, ARCHIVO_DEMASIADO_GRANDE (400).
         */
        post: operations["validar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categorias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Todas las categorías, con su cantidad de productos */
        get: operations["listar_6"];
        put?: never;
        /**
         * Crear una categoría
         * @description Error: CATEGORIA_DUPLICADA (409).
         */
        post: operations["crear_5"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categorias/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Editar una categoría
         * @description Errores: CATEGORIA_DUPLICADA, MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["actualizar_7"];
        post?: never;
        /**
         * Eliminar una categoría sin productos
         * @description Error: CATEGORIA_CON_PRODUCTOS (422).
         */
        delete: operations["eliminar_2"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clientes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de clientes
         * @description Busca por nombre, documento, teléfono o ciudad. Orden por defecto: nombre.
         */
        get: operations["buscar_2"];
        put?: never;
        /**
         * Crear un cliente
         * @description Errores: TELEFONO_INVALIDO, DOCUMENTO_INCOMPLETO (400); CLIENTE_DOCUMENTO_DUPLICADO (409).
         */
        post: operations["crear_4"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clientes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de un cliente */
        get: operations["detalle_5"];
        /**
         * Editar un cliente
         * @description Además: MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["actualizar_6"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clientes/{id}/historial": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Historial del cliente
         * @description Sus ventas (y desde la Fase 4, instalaciones), incluidas las anuladas (RF-77).
         */
        get: operations["historial_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/compras": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de compras con los totales del período
         * @description Sin fechas, el mes en curso. Los totales no incluyen las anuladas. Orden por defecto: más recientes primero.
         */
        get: operations["listar_5"];
        put?: never;
        /**
         * Registrar una compra y sumarla al inventario
         * @description Con la misma Idempotency-Key devuelve la compra ya creada. Errores (400): SERIALES_NO_COINCIDEN, CANTIDAD_INVALIDA, COMPRA_PRODUCTO_REPETIDO, COMPRA_FECHA_FUTURA, COMPRA_COSTO_INVALIDO, PROVEEDOR_NO_EXISTE, PRODUCTO_NO_EXISTE; (409) SERIAL_DUPLICADO; (422) TASA_NO_DISPONIBLE, PRODUCTO_INACTIVO.
         */
        post: operations["registrar_4"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/compras/vista-previa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Vista previa: costo actual → nuevo y regla por línea, sin guardar
         * @description Es el valor oficial que muestra el frontend (BF-06). Errores: TASA_NO_DISPONIBLE, COMPRA_PRODUCTO_REPETIDO, COMPRA_FECHA_FUTURA, PRODUCTO_NO_EXISTE.
         */
        post: operations["vistaPrevia_4"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/compras/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de una compra, con si se puede anular y por qué no */
        get: operations["detalle_8"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/compras/{id}/anular": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Anular una compra
         * @description Solo si es el último movimiento de cada producto y sus seriales siguen en bodega. Errores: COMPRA_NO_ANULABLE (422), COMPRA_YA_ANULADA (409).
         */
        post: operations["anular_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/compras/{id}/factura": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Subir o reemplazar la factura (JPEG, PNG, WebP o PDF; máximo 5 MB)
         * @description Errores: ARCHIVO_TIPO_NO_PERMITIDO, ARCHIVO_DEMASIADO_GRANDE (400).
         */
        put: operations["cambiarFactura"];
        post?: never;
        /** Quitar la factura */
        delete: operations["quitarFactura"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/comprobantes/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Descargar un comprobante con su enlace público, sin sesión
         * @description El enlace vence a los 30 días (P-33). Error: RECURSO_NO_ENCONTRADO (404).
         */
        get: operations["descargar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/configuracion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Configuración actual */
        get: operations["obtener"];
        /**
         * Editar la configuración
         * @description Errores: CONFIGURACION_INVALIDA (400), MODIFICADO_POR_OTRO_USUARIO (409). Validez: 8, 15 o 30 días; garantías: 1 a 3 meses; límite de variación: más de 0 % y hasta 100 %.
         */
        put: operations["actualizar_5"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/configuracion/logo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Subir o reemplazar el logo (JPEG, PNG o WebP; máximo 5 MB)
         * @description Errores: ARCHIVO_TIPO_NO_PERMITIDO, ARCHIVO_DEMASIADO_GRANDE (400).
         */
        put: operations["cambiarLogo"];
        post?: never;
        /** Quitar el logo */
        delete: operations["quitarLogo"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de cotizaciones
         * @description Filtros opcionales. porVencer=true trae solo las En evaluación que vencen en 3 días o menos (RF-91). Orden por defecto: más recientes primero.
         */
        get: operations["listar_4"];
        put?: never;
        /**
         * Registrar una cotización en Borrador
         * @description La fecha es hoy y no toca el inventario (RN-11). Con la misma Idempotency-Key devuelve la cotización ya creada. Errores (400): COTIZACION_SIN_LINEAS, COTIZACION_VACIA, COTIZACION_SIN_DESCRIPCION, COTIZACION_MANO_OBRA_EN_VENTA, COTIZACION_VALIDEZ_INVALIDA, COTIZACION_PRODUCTO_REPETIDO, DESCUENTO_INVALIDO, PRECIO_INVALIDO, CLIENTE_NO_EXISTE, PRODUCTO_NO_EXISTE; (422) PRODUCTO_INACTIVO, TASA_NO_DISPONIBLE.
         */
        post: operations["registrar_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/vista-previa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Vista previa: precios, costos con las tasas de hoy y de compra, y utilidad
         * @description No guarda nada. Es el valor oficial que muestra el frontend y con el que dibuja la vista previa del PDF (RF-85). El stock es solo informativo (RF-86). Errores: TASA_NO_DISPONIBLE, PRODUCTO_INACTIVO (422); DESCUENTO_INVALIDO, COTIZACION_* , CLIENTE_NO_EXISTE (400).
         */
        post: operations["vistaPrevia_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de una cotización con sus versiones anteriores */
        get: operations["detalle_4"];
        /**
         * Editar una cotización
         * @description En Borrador se reemplaza; En evaluación se guarda como nueva versión (COT-0001 v2) y se conserva la anterior (RF-88). La fecha y el vencimiento se recalculan desde hoy. Errores: TRANSICION_NO_PERMITIDA (422), MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["editar"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/aprobar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cliente aprobó
         * @description Desde Borrador o En evaluación (P-48). Error: TRANSICION_NO_PERMITIDA (422).
         */
        post: operations["aprobar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/comprobante": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Descargar la cotización en PDF (RF-133)
         * @description No cambia el estado: para marcarla enviada, llamar a /enviar (P-50).
         */
        get: operations["comprobante_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/conversion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Datos para convertir una cotización aprobada en venta o instalación
         * @description Devuelve el formulario precargado y los avisos de precio, costo y stock cambiados (RF-94, RF-96). La conversión se guarda con POST /ventas o POST /instalaciones enviando cotizacionId. Error: COTIZACION_NO_CONVERTIBLE (422).
         */
        get: operations["conversion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/duplicar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Duplicar en una cotización nueva en Borrador
         * @description Copia productos, cantidades, precios cotizados, mano de obra y descripción, con fecha y tasas de hoy (RF-87, P-52). Errores: PRODUCTO_INACTIVO, TASA_NO_DISPONIBLE (422).
         */
        post: operations["duplicar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/enlace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crear el enlace público del PDF para WhatsApp
         * @description Vence a los 30 días (P-33). Si la cotización estaba en Borrador, queda En evaluación (P-50).
         */
        post: operations["enlace_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/enviar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Marcar como enviada (pasa a En evaluación)
         * @description El frontend la llama también al pulsar Descargar PDF (P-50). Reenviar una En evaluación solo actualiza la fecha de envío. Error: TRANSICION_NO_PERMITIDA (422).
         */
        post: operations["enviar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/rechazar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Marcar como rechazada, con motivo opcional
         * @description Desde Borrador, En evaluación o Aprobada. Error: TRANSICION_NO_PERMITIDA (422).
         */
        post: operations["rechazar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cotizaciones/{id}/seguimiento": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Mensaje de seguimiento por WhatsApp (RF-92) */
        get: operations["seguimiento"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/garantias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consulta de garantías de ventas e instalaciones
         * @description Mano de obra de cada instalación y cada equipo con serial vendido o instalado, de documentos no anulados. Ordenadas de la que vence primero a la última.
         */
        get: operations["consultar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/garantias/reclamos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Reclamos registrados, del más reciente al más antiguo */
        get: operations["reclamos"];
        put?: never;
        /**
         * Registrar un reclamo sobre una instalación o un serial
         * @description Si la garantía ya venció se registra igual, con enGarantia=false (P-45). Errores: RECLAMO_INVALIDO (400), RECURSO_NO_ENCONTRADO (404).
         */
        post: operations["registrar_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/garantias/reclamos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Escribir o corregir la solución de un reclamo
         * @description Error: MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["cambiarSolucion"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de instalaciones con los totales del período
         * @description Sin fechas, el mes en curso. Los totales no incluyen las anuladas. Filtrar por estado de garantía excluye las anuladas. Orden por defecto: más recientes primero.
         */
        get: operations["listar_3"];
        put?: never;
        /**
         * Registrar una instalación y descontar el material del inventario
         * @description Con la misma Idempotency-Key devuelve la instalación ya creada. Errores (400): INSTALACION_FECHA_FUTURA, INSTALACION_VACIA, INSTALACION_SIN_TECNICOS, INSTALACION_GARANTIA_INVALIDA, INSTALACION_PRODUCTO_REPETIDO, TECNICO_NO_EXISTE, CLIENTE_NO_EXISTE, PRODUCTO_NO_EXISTE, CANTIDAD_INVALIDA, SERIALES_NO_COINCIDEN, DESCUENTO_INVALIDO, PRECIO_INVALIDO; (422) STOCK_INSUFICIENTE, SERIAL_NO_DISPONIBLE, PRODUCTO_INACTIVO, TASA_NO_DISPONIBLE.
         */
        post: operations["registrar_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/vista-previa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Vista previa: material, cobro, utilidad y garantías, sin guardar
         * @description Es el valor oficial que muestra el frontend (BF-06). Si una línea no tiene stock suficiente, trae avisoStock y puedeGuardar=false.
         */
        post: operations["vistaPrevia_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle con material, seriales, fotos, garantías y cobro */
        get: operations["detalle_3"];
        /**
         * Corregir dirección, descripción, técnicos, condiciones y observaciones
         * @description Los valores, la fecha y el plazo de garantía no se editan (RF-122, P-44). Error: MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["actualizar_4"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/{id}/anular": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Anular una instalación
         * @description El material vuelve al costo vigente y los seriales a bodega; las fotos se conservan. Error: INSTALACION_YA_ANULADA (409).
         */
        post: operations["anular_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/{id}/comprobante": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Descargar el comprobante de instalación en PDF (RF-133) */
        get: operations["comprobante_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/{id}/enlace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crear el enlace público del comprobante para WhatsApp
         * @description Vence a los 30 días (P-33). Trae el mensaje y el enlace wa.me del cliente.
         */
        post: operations["enlace_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/{id}/fotos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Agregar una foto a un grupo (JPEG, PNG o WebP; máximo 5 MB)
         * @description Máximo 30 por grupo (P-42). Errores: ARCHIVO_TIPO_NO_PERMITIDO, ARCHIVO_DEMASIADO_GRANDE (400); FOTOS_MAXIMAS (422).
         */
        post: operations["agregarFoto"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/instalaciones/{id}/fotos/{fotoId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Quitar una foto */
        delete: operations["quitarFoto_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventario": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado valorizado con la cantidad de productos y el valor total
         * @description Busca por nombre, código, marca o número de serie. Valores en USD, COP y VES con las tasas vigentes. Orden por defecto: nombre.
         */
        get: operations["listar_9"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventario/productos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Indicadores del producto en las tres monedas y seriales por estado */
        get: operations["detalle_7"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventario/productos/{id}/historial-costo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Cambios de costo del producto, del más reciente al más antiguo */
        get: operations["historialCosto"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventario/productos/{id}/kardex": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Kárdex del producto
         * @description Orden por defecto: el movimiento más reciente primero.
         */
        get: operations["kardex"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventario/productos/{id}/seriales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Seriales del producto, todos o de un estado */
        get: operations["seriales"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/productos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de productos
         * @description Busca por nombre, código o marca. Orden por defecto: nombre.
         */
        get: operations["buscar_1"];
        put?: never;
        /**
         * Crear un producto (queda con stock 0 y sin costo)
         * @description Errores: PRODUCTO_CODIGO_DUPLICADO (409), CATEGORIA_NO_EXISTE, UNIDAD_NO_EXISTE, CANTIDAD_INVALIDA (400).
         */
        post: operations["crear_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/productos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de un producto */
        get: operations["detalle_2"];
        /**
         * Editar un producto
         * @description Errores: PRODUCTO_CODIGO_DUPLICADO, MODIFICADO_POR_OTRO_USUARIO (409); PRODUCTO_CAMBIO_NO_PERMITIDO (422).
         */
        put: operations["actualizar_3"];
        post?: never;
        /**
         * Eliminar un producto sin movimientos
         * @description Error: PRODUCTO_CON_MOVIMIENTOS (422).
         */
        delete: operations["eliminar_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/productos/{id}/activar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Activar un producto desactivado */
        post: operations["activar_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/productos/{id}/desactivar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Desactivar: deja de aparecer para vender, conserva su historial */
        post: operations["desactivar_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/productos/{id}/foto": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Subir o reemplazar la foto (JPEG, PNG o WebP; máximo 5 MB)
         * @description Errores: ARCHIVO_TIPO_NO_PERMITIDO, ARCHIVO_DEMASIADO_GRANDE (400).
         */
        put: operations["cambiarFoto"];
        post?: never;
        /** Quitar la foto */
        delete: operations["quitarFoto"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/proveedores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de proveedores
         * @description Busca por nombre, NIT o ciudad. Orden por defecto: nombre.
         */
        get: operations["buscar"];
        put?: never;
        /**
         * Crear un proveedor
         * @description Error: TELEFONO_INVALIDO (400).
         */
        post: operations["crear_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/proveedores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de un proveedor */
        get: operations["detalle_1"];
        /**
         * Editar un proveedor
         * @description Además: MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["actualizar_2"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/seriales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Buscar un serial desde cualquier pantalla
         * @description Hasta 50 seriales que contienen el texto, sin distinguir mayúsculas.
         */
        get: operations["buscar_3"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/seriales/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Historial completo de un serial */
        get: operations["historial_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sesion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Usuario de la sesión actual */
        get: operations["actual"];
        put?: never;
        /** Iniciar sesión con correo y contraseña */
        post: operations["iniciar"];
        /** Cerrar la sesión actual */
        delete: operations["cerrar"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Historial de tasas por par y rango de fechas (RF-34) */
        get: operations["historial"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/trm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registrar la TRM de hoy a mano cuando falla la consulta automática (RF-33)
         * @description Errores: los mismos del bolívar y TRM_AUTOMATICA_DISPONIBLE (409) si ya está la oficial. Si más tarde llega la oficial, reemplaza a la manual (P-13).
         */
        post: operations["registrarTrm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/trm/consultar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Consultar ahora la TRM oficial de hoy
         * @description Resultado: EXITO, FALLO u OMITIDA (ya estaba guardada).
         */
        post: operations["consultarTrm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/ves": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registrar la tasa del bolívar de hoy (RF-29, RF-35)
         * @description Errores: TASA_NO_CONFIRMADA, TASA_INVALIDA (400); TASA_YA_REGISTRADA (409); TASA_VARIACION_NO_ACEPTADA (422).
         */
        post: operations["registrarBolivar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/vigentes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Tasas del día para el menú y la barra superior (RF-30)
         * @description Si falta la tasa de hoy devuelve la última con esDeHoy=false y un aviso (RF-33).
         */
        get: operations["vigentes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/vista-previa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tasa anterior, nueva y variación antes de guardar (RF-35b); no guarda nada */
        post: operations["vistaPrevia_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de una tasa con sus correcciones */
        get: operations["detalle_6"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tasas/{id}/corregir": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Corregir una tasa (RF-36)
         * @description Queda registro del valor anterior, el nuevo y el usuario. Errores: TASA_NO_CONFIRMADA, TASA_SIN_CAMBIO (400); TASA_VARIACION_NO_ACEPTADA (422).
         */
        post: operations["corregir"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/unidades-medida": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Todas las unidades de medida */
        get: operations["listar_2"];
        put?: never;
        /**
         * Crear una unidad de medida
         * @description Error: UNIDAD_DUPLICADA (409).
         */
        post: operations["crear_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/unidades-medida/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Editar una unidad de medida
         * @description Errores: UNIDAD_DUPLICADA, MODIFICADO_POR_OTRO_USUARIO (409); UNIDAD_EN_USO (422) si se cambia admiteDecimales y la usan productos.
         */
        put: operations["actualizar_1"];
        post?: never;
        /**
         * Eliminar una unidad que no usa ningún producto
         * @description Error: UNIDAD_EN_USO (422).
         */
        delete: operations["eliminar"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/usuarios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Todos los usuarios */
        get: operations["listar_1"];
        put?: never;
        /**
         * Crear un usuario con su contraseña inicial
         * @description Errores: CONTRASENA_NO_COINCIDE, CONTRASENA_DEBIL (400); USUARIO_CORREO_DUPLICADO (409).
         */
        post: operations["crear"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/usuarios/actual/contrasena": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Cambiar la contraseña del usuario actual
         * @description Conserva la sesión actual y cierra las demás sesiones del usuario. La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un signo.
         */
        put: operations["cambiarContrasena"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/usuarios/tecnicos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Usuarios activos que se pueden elegir como técnicos (P-37) */
        get: operations["tecnicos"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/usuarios/{id}/activar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Activar un usuario */
        post: operations["activar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/usuarios/{id}/desactivar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Desactivar un usuario y cerrar sus sesiones
         * @description Error: NO_PUEDE_DESACTIVARSE_A_SI_MISMO (422).
         */
        post: operations["desactivar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/usuarios/{id}/restablecer-contrasena": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Asignar una nueva contraseña a otro usuario y cerrar sus sesiones
         * @description Errores: CONTRASENA_NO_COINCIDE, CONTRASENA_DEBIL (400); USAR_CAMBIO_DE_CONTRASENA (422) si es el propio usuario.
         */
        post: operations["restablecerContrasena"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ventas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listado paginado de ventas con los totales del período
         * @description Sin fechas, el mes en curso. Los totales no incluyen las anuladas. Orden por defecto: más recientes primero.
         */
        get: operations["listar"];
        put?: never;
        /**
         * Registrar una venta y descontarla del inventario
         * @description La fecha es hoy. Con la misma Idempotency-Key devuelve la venta ya creada. Errores (400): CANTIDAD_INVALIDA, SERIALES_NO_COINCIDEN, DESCUENTO_INVALIDO, VENTA_PRODUCTO_REPETIDO, PRECIO_INVALIDO, CLIENTE_NO_EXISTE, PRODUCTO_NO_EXISTE; (422) STOCK_INSUFICIENTE, SERIAL_NO_DISPONIBLE, PRODUCTO_INACTIVO, TASA_NO_DISPONIBLE.
         */
        post: operations["registrar"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ventas/vista-previa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Vista previa: precios, disponibilidad, costos y utilidad, sin guardar
         * @description Es el valor oficial que muestra el frontend (BF-06). Si una línea no tiene stock suficiente, trae avisoStock y puedeGuardar=false. Errores: TASA_NO_DISPONIBLE (422), DESCUENTO_INVALIDO, VENTA_PRODUCTO_REPETIDO, CLIENTE_NO_EXISTE (400).
         */
        post: operations["vistaPrevia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ventas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalle de una venta con seriales, garantía y utilidad */
        get: operations["detalle"];
        /**
         * Cambiar las observaciones y las monedas adicionales del comprobante
         * @description Los valores de la venta no se editan (RF-70). Error: MODIFICADO_POR_OTRO_USUARIO (409).
         */
        put: operations["actualizar"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ventas/{id}/anular": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Anular una venta
         * @description El material vuelve al costo vigente y los seriales a bodega. Error: VENTA_YA_ANULADA (409).
         */
        post: operations["anular"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ventas/{id}/comprobante": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Descargar el comprobante de venta en PDF (RF-133) */
        get: operations["comprobante"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ventas/{id}/enlace": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Crear el enlace público del comprobante para WhatsApp
         * @description Vence a los 30 días (P-33). Trae el mensaje listo y el enlace wa.me con el número del cliente (RF-134).
         */
        post: operations["enlace"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AjusteVista: {
            abreviatura?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad?: string;
            consecutivo?: string;
            costoUnitarioUsd?: components["schemas"]["Dinero"];
            descripcion?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            motivo?: string;
            motivoEtiqueta?: string;
            producto?: components["schemas"]["ProductoReferencia"];
            /** Format: date-time */
            registradoEn?: string;
            registradoPor?: string;
            seriales?: string[];
            tipo?: string;
            valorUsd?: components["schemas"]["Dinero"];
        };
        Anulacion: {
            /** Format: date-time */
            fecha?: string;
            motivo?: string;
            usuario?: string;
        };
        Aviso: {
            mensaje?: string;
            /** Format: int64 */
            productoId?: number;
            tipo?: string;
        };
        CambioCostoVista: {
            costoAnteriorUsd?: components["schemas"]["Dinero"];
            costoFactura?: components["schemas"]["Dinero"];
            costoFacturaUsd?: components["schemas"]["Dinero"];
            costoNuevoUsd?: components["schemas"]["Dinero"];
            documento?: components["schemas"]["DocumentoRef"];
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** Format: date-time */
            registradoEn?: string;
            regla?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            tasaFactura?: string;
            usuario?: string;
        };
        CargaInicialVista: {
            archivo?: string;
            /** Format: int32 */
            clientesCreados?: number;
            consecutivo?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** Format: int32 */
            productosConStock?: number;
            /** Format: int32 */
            productosCreados?: number;
            /** Format: int32 */
            proveedoresCreados?: number;
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            valorUsd?: components["schemas"]["Dinero"];
        };
        CategoriaVista: {
            /** Format: int64 */
            cantidadProductos?: number;
            /** Format: int64 */
            id?: number;
            nombre?: string;
            /** Format: int64 */
            version?: number;
        };
        ClienteDocumentoVista: {
            ciudad?: string;
            direccion?: string;
            documento?: string;
            /** Format: int64 */
            id?: number;
            nombre?: string;
            precioAplicado?: string;
            telefono?: string;
            tipo?: string;
        };
        ClienteVista: {
            /** Format: int64 */
            cantidadMovimientos?: number;
            ciudad?: string;
            correo?: string;
            direccion?: string;
            /** Format: date */
            fechaUltimoMovimiento?: string;
            /** Format: int64 */
            id?: number;
            nombre?: string;
            numeroDocumento?: string;
            /** @enum {string} */
            precioAplicado?: "INSTALADOR" | "CLIENTE_FINAL";
            precioAplicadoDescripcion?: string;
            telefono?: string;
            /** @enum {string} */
            tipo?: "INSTALADOR" | "CLIENTE_FINAL";
            /** @enum {string} */
            tipoDocumento?: "CC" | "NIT";
            /** Format: int64 */
            version?: number;
        };
        CompraResumenVista: {
            consecutivo?: string;
            estado?: string;
            facturaUrl?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            numeroFactura?: string;
            productos?: string;
            proveedor?: components["schemas"]["Referencia"];
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            tasas?: components["schemas"]["TasasCompraVista"];
            total?: components["schemas"]["Dinero"];
            totalUsd?: components["schemas"]["Dinero"];
        };
        CompraVista: {
            anulable?: boolean;
            anulacion?: components["schemas"]["Anulacion"];
            consecutivo?: string;
            estado?: string;
            facturaUrl?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            lineas?: components["schemas"]["Linea"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            motivoNoAnulable?: string;
            numeroFactura?: string;
            proveedor?: components["schemas"]["Referencia"];
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            tasas?: components["schemas"]["TasasCompraVista"];
            total?: components["schemas"]["Dinero"];
            totalUsd?: components["schemas"]["Dinero"];
        };
        ConfiguracionVista: {
            condicionesGarantia?: string;
            empresaCiudad?: string;
            empresaCorreo?: string;
            empresaLema?: string;
            empresaNit?: string;
            empresaNombre?: string;
            empresaTelefono?: string;
            /** Format: int32 */
            garantiaEquiposMeses?: number;
            /** Format: int32 */
            garantiaManoObraMeses?: number;
            /**
             * Format: decimal
             * @example 19.5000
             */
            limiteVariacionTasa?: string;
            logoUrl?: string;
            piePdf?: string;
            /** Format: int32 */
            validezCotizacionDias?: number;
            /** Format: int64 */
            version?: number;
        };
        ConversionCotizacionVista: {
            avisos?: components["schemas"]["Aviso"][];
            cliente?: string;
            /** Format: int64 */
            clienteId?: number;
            consecutivo?: string;
            /** Format: int64 */
            cotizacionId?: number;
            descripcion?: string;
            /** @enum {string} */
            descuentoTipo?: "PORCENTAJE" | "VALOR";
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            direccion?: string;
            lineas?: components["schemas"]["Linea"][];
            /**
             * Format: decimal
             * @example 19.5000
             */
            manoDeObra?: string;
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            puedeGuardar?: boolean;
            tipo?: string;
        };
        CorreccionVista: {
            automatica?: boolean;
            /** Format: date-time */
            corregidaEn?: string;
            corregidaPor?: string;
            motivo?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valorAnterior?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valorNuevo?: string;
        };
        CotizacionOrigenVista: {
            consecutivo?: string;
            /** Format: int64 */
            id?: number;
        };
        CotizacionResumenVista: {
            cliente?: string;
            /** Format: int64 */
            clienteId?: number;
            consecutivo?: string;
            /** Format: int64 */
            diasParaVencer?: number;
            documentoGenerado?: string;
            estado?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            porVencer?: boolean;
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            tipo?: string;
            total?: components["schemas"]["Dinero"];
            totalUsd?: components["schemas"]["Dinero"];
            /** Format: date */
            vence?: string;
        };
        CotizacionVista: {
            /** Format: date-time */
            aprobadaEn?: string;
            cliente?: components["schemas"]["ClienteDocumentoVista"];
            consecutivo?: string;
            descripcion?: string;
            descuentoTipo?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            /** Format: int64 */
            diasParaVencer?: number;
            documentoGenerado?: components["schemas"]["DocumentoGenerado"];
            /** Format: date-time */
            enviadaEn?: string;
            estado?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            lineas?: components["schemas"]["Linea"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            /** Format: int32 */
            numeroVersion?: number;
            observaciones?: string;
            porVencer?: boolean;
            /**
             * Format: decimal
             * @example 19.5000
             */
            porcentajeUtilidad?: string;
            rechazo?: components["schemas"]["Rechazo"];
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            resumen?: components["schemas"]["ResumenCobroVista"];
            tasas?: components["schemas"]["TasasDocumentoVista"];
            tipo?: string;
            total?: components["schemas"]["Dinero"];
            utilidad?: components["schemas"]["Dinero"];
            /** Format: int32 */
            validezDias?: number;
            /** Format: date */
            vence?: string;
            /** Format: date */
            vencidaEl?: string;
            /** Format: int64 */
            version?: number;
            versionesAnteriores?: components["schemas"]["VersionAnterior"][];
        };
        Dinero: {
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            /**
             * Format: decimal
             * @example 19.5000
             */
            monto?: string;
        };
        DocumentoGenerado: {
            consecutivo?: string;
            /** Format: date-time */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            tipo?: string;
        };
        DocumentoRef: {
            consecutivo?: string;
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            tipo?: "COMPRA" | "AJUSTE" | "INVENTARIO_INICIAL" | "VENTA" | "INSTALACION" | "COTIZACION";
        };
        EnlaceComprobante: {
            mensaje?: string;
            url?: string;
            /** Format: date-time */
            venceEn?: string;
            whatsappUrl?: string;
        };
        EnlaceComprobanteVista: {
            mensaje?: string;
            url?: string;
            /** Format: date-time */
            venceEn?: string;
            whatsappUrl?: string;
        };
        EnlaceCotizacionVista: {
            estado?: string;
            mensaje?: string;
            url?: string;
            /** Format: date-time */
            venceEn?: string;
            whatsappUrl?: string;
        };
        ErrorCarga: {
            /** Format: int32 */
            fila?: number;
            hoja?: string;
            mensaje?: string;
        };
        Foto: {
            /** Format: int64 */
            id?: number;
            /** Format: date-time */
            subidaEn?: string;
            url?: string;
        };
        Fotos: {
            antes?: components["schemas"]["Foto"][];
            despues?: components["schemas"]["Foto"][];
            durante?: components["schemas"]["Foto"][];
        };
        GarantiaVista: {
            clase?: string;
            cliente?: string;
            /** Format: int64 */
            clienteId?: number;
            /** Format: int64 */
            diasRestantes?: number;
            documento?: components["schemas"]["DocumentoRef"];
            /** @enum {string} */
            estado?: "VIGENTE" | "POR_VENCER" | "VENCIDA";
            /** Format: date */
            fecha?: string;
            producto?: string;
            serial?: string;
            /** Format: int64 */
            serialId?: number;
            tipo?: string;
            /** Format: date */
            vencimiento?: string;
        };
        GarantiasInstalacionVista: {
            condiciones?: string;
            /** @enum {string} */
            estadoEquipos?: "VIGENTE" | "POR_VENCER" | "VENCIDA";
            /** @enum {string} */
            estadoManoObra?: "VIGENTE" | "POR_VENCER" | "VENCIDA";
            /** Format: int32 */
            manoObraMeses?: number;
            /** Format: date */
            venceEquipos?: string;
            /** Format: date */
            venceManoObra?: string;
        };
        HistorialClienteVista: {
            /** Format: int64 */
            clienteId?: number;
            /** Format: int64 */
            compras?: number;
            /** Format: int64 */
            instalaciones?: number;
            movimientos?: components["schemas"]["Movimiento"][];
            nombre?: string;
        };
        HistorialSerialVista: {
            movimientos?: components["schemas"]["Movimiento"][];
            reclamos?: components["schemas"]["Reclamo"][];
            serial?: components["schemas"]["SerialVista"];
        };
        InstalacionResumenVista: {
            cliente?: string;
            /** Format: int64 */
            clienteId?: number;
            consecutivo?: string;
            direccion?: string;
            estado?: string;
            /** @enum {string} */
            estadoGarantia?: "VIGENTE" | "POR_VENCER" | "VENCIDA";
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            tecnicos?: string;
            total?: components["schemas"]["Dinero"];
            totalUsd?: components["schemas"]["Dinero"];
            utilidad?: components["schemas"]["Dinero"];
            /** Format: date */
            venceManoObra?: string;
        };
        InstalacionVista: {
            anulacion?: components["schemas"]["Anulacion"];
            cliente?: components["schemas"]["ClienteDocumentoVista"];
            consecutivo?: string;
            cotizacion?: components["schemas"]["CotizacionOrigenVista"];
            descripcion?: string;
            descuentoTipo?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            direccion?: string;
            estado?: string;
            /** Format: date */
            fecha?: string;
            fotos?: components["schemas"]["Fotos"];
            garantias?: components["schemas"]["GarantiasInstalacionVista"];
            /** Format: int64 */
            id?: number;
            lineas?: components["schemas"]["Linea"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            porcentajeUtilidad?: string;
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            resumen?: components["schemas"]["ResumenCobroVista"];
            tasas?: components["schemas"]["TasasDocumentoVista"];
            tecnicos?: components["schemas"]["UsuarioReferencia"][];
            total?: components["schemas"]["Dinero"];
            utilidad?: components["schemas"]["Dinero"];
            /** Format: int64 */
            version?: number;
        };
        InventarioVista: {
            avisos?: string[];
            productos?: components["schemas"]["PaginaProducto"];
            /** Format: int64 */
            totalProductos?: number;
            valorTotal?: components["schemas"]["MontoEnMonedas"];
        };
        Linea: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad?: string;
            codigo?: string;
            costoUnitarioUsd?: components["schemas"]["Dinero"];
            descripcion?: string;
            precioSugerido?: components["schemas"]["Dinero"];
            precioUnitario?: components["schemas"]["Dinero"];
            /** Format: int64 */
            productoId?: number;
            seriales?: components["schemas"]["SerialVendido"][];
            subtotal?: components["schemas"]["Dinero"];
            unidad?: string;
        };
        LineaAnterior: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad?: string;
            codigo?: string;
            descripcion?: string;
            precioUnitario?: components["schemas"]["Dinero"];
            /** Format: int64 */
            productoId?: number;
            subtotal?: components["schemas"]["Dinero"];
            unidad?: string;
        };
        LineaVistaPrevia: {
            abreviatura?: string;
            avisoPrecio?: string;
            avisoStock?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad?: string;
            codigo?: string;
            controlaSerial?: boolean;
            costoUnitarioHoy?: components["schemas"]["MontoEnMonedas"];
            costoUnitarioUltimaCompra?: components["schemas"]["MontoEnMonedas"];
            /**
             * Format: decimal
             * @example 19.5000
             */
            disponible?: string;
            nombre?: string;
            precioSugerido?: components["schemas"]["Dinero"];
            precioUnitario?: components["schemas"]["Dinero"];
            /** Format: int64 */
            productoId?: number;
            subtotal?: components["schemas"]["MontoEnMonedas"];
            ultimaCompra?: components["schemas"]["UltimaCompra"];
        };
        ListadoComprasVista: {
            compras?: components["schemas"]["PaginaCompraResumenVista"];
            /** Format: date */
            desde?: string;
            /** Format: date */
            hasta?: string;
            totalUsd?: components["schemas"]["Dinero"];
            totalesPorMoneda?: components["schemas"]["TotalMoneda"][];
        };
        ListadoInstalacionesVista: {
            /** Format: date */
            desde?: string;
            /** Format: date */
            hasta?: string;
            instalaciones?: components["schemas"]["PaginaInstalacionResumenVista"];
            totalUsd?: components["schemas"]["Dinero"];
            totalesPorMoneda?: components["schemas"]["TotalMoneda"][];
            utilidadUsd?: components["schemas"]["Dinero"];
        };
        ListadoVentasVista: {
            /** Format: date */
            desde?: string;
            /** Format: date */
            hasta?: string;
            totalUsd?: components["schemas"]["Dinero"];
            totalesPorMoneda?: components["schemas"]["TotalMoneda"][];
            utilidadUsd?: components["schemas"]["Dinero"];
            ventas?: components["schemas"]["PaginaVentaResumenVista"];
        };
        MontoEnMonedas: {
            cop?: components["schemas"]["Dinero"];
            usd?: components["schemas"]["Dinero"];
            ves?: components["schemas"]["Dinero"];
        };
        Movimiento: {
            detalle?: string;
            documento?: components["schemas"]["DocumentoRef"];
            /** Format: date */
            fecha?: string;
            /** Format: date-time */
            registradoEn?: string;
            tipo?: string;
            usuario?: string;
        };
        MovimientoKardexVista: {
            costoUnitarioUsd?: components["schemas"]["Dinero"];
            detalle?: string;
            documento?: components["schemas"]["DocumentoRef"];
            /**
             * Format: decimal
             * @example 19.5000
             */
            entrada?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** Format: date-time */
            registradoEn?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            saldo?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            salida?: string;
            tipo?: string;
            tipoEtiqueta?: string;
            usuario?: string;
        };
        PaginaAjusteVista: {
            contenido?: components["schemas"]["AjusteVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaClienteVista: {
            contenido?: components["schemas"]["ClienteVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaCompraResumenVista: {
            contenido?: components["schemas"]["CompraResumenVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaCotizacionResumenVista: {
            contenido?: components["schemas"]["CotizacionResumenVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaGarantiaVista: {
            contenido?: components["schemas"]["GarantiaVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaInstalacionResumenVista: {
            contenido?: components["schemas"]["InstalacionResumenVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaMovimientoKardexVista: {
            contenido?: components["schemas"]["MovimientoKardexVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaProducto: {
            contenido?: components["schemas"]["Producto"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaProductoVista: {
            contenido?: components["schemas"]["ProductoVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaProveedorVista: {
            contenido?: components["schemas"]["ProveedorVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaTasaVista: {
            contenido?: components["schemas"]["TasaVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        PaginaVentaResumenVista: {
            contenido?: components["schemas"]["VentaResumenVista"][];
            /** Format: int32 */
            pagina?: number;
            /** Format: int32 */
            tamano?: number;
            /** Format: int64 */
            totalElementos?: number;
            /** Format: int32 */
            totalPaginas?: number;
        };
        ProblemDetail: {
            detail?: string | null;
            /** Format: uri */
            instance?: string | null;
            properties?: {
                [key: string]: unknown;
            } | null;
            /** Format: int32 */
            status?: number;
            title?: string | null;
            /** Format: uri */
            type?: string;
        };
        Producto: {
            abreviatura?: string;
            activo?: boolean;
            bajoMinimo?: boolean;
            categoria?: string;
            codigo?: string;
            controlaSerial?: boolean;
            costoActualUsd?: components["schemas"]["Dinero"];
            fotoUrl?: string;
            /** Format: int64 */
            id?: number;
            marca?: string;
            nombre?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            stock?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            stockMinimo?: string;
            valorEnBodega?: components["schemas"]["MontoEnMonedas"];
        };
        ProductoInventarioVista: {
            abreviatura?: string;
            activo?: boolean;
            avisos?: string[];
            bajoMinimo?: boolean;
            categoria?: string;
            codigo?: string;
            controlaSerial?: boolean;
            costoActual?: components["schemas"]["MontoEnMonedas"];
            fotoUrl?: string;
            /** Format: int64 */
            id?: number;
            marca?: string;
            modelo?: string;
            nombre?: string;
            precioClienteFinal?: components["schemas"]["MontoEnMonedas"];
            precioInstalador?: components["schemas"]["MontoEnMonedas"];
            seriales?: components["schemas"]["SerialesPorEstado"];
            /**
             * Format: decimal
             * @example 19.5000
             */
            stock?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            stockMinimo?: string;
            valorEnBodega?: components["schemas"]["MontoEnMonedas"];
        };
        ProductoReferencia: {
            codigo?: string;
            /** Format: int64 */
            id?: number;
            nombre?: string;
        };
        ProductoVista: {
            activo?: boolean;
            bajoMinimo?: boolean;
            categoria?: components["schemas"]["Referencia"];
            codigo?: string;
            controlaSerial?: boolean;
            costoActual?: components["schemas"]["Dinero"];
            descripcion?: string;
            fotoUrl?: string;
            /** Format: int64 */
            id?: number;
            marca?: string;
            modelo?: string;
            nombre?: string;
            precioClienteFinal?: components["schemas"]["Dinero"];
            precioInstalador?: components["schemas"]["Dinero"];
            /**
             * Format: decimal
             * @example 19.5000
             */
            stock?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            stockMinimo?: string;
            unidadMedida?: components["schemas"]["UnidadMedidaVista"];
            /** Format: int64 */
            version?: number;
        };
        ProveedorVista: {
            ciudad?: string;
            correo?: string;
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            monedaHabitual?: "USD" | "COP" | "VES";
            nit?: string;
            nombre?: string;
            telefono?: string;
            /** Format: int64 */
            version?: number;
        };
        Rechazo: {
            detalle?: string;
            /** Format: date-time */
            fecha?: string;
            motivo?: string;
        };
        Reclamo: {
            enGarantia?: boolean;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            problema?: string;
            solucion?: string;
        };
        ReclamoVista: {
            cliente?: string;
            /** Format: int64 */
            clienteId?: number;
            documento?: string;
            enGarantia?: boolean;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** Format: int64 */
            instalacionId?: number;
            problema?: string;
            /** Format: date-time */
            registradoEn?: string;
            registradoPor?: string;
            serial?: string;
            /** Format: int64 */
            serialId?: number;
            solucion?: string;
            tipo?: string;
            /** Format: date */
            vencimiento?: string;
            /** Format: int64 */
            version?: number;
        };
        Referencia: {
            /** Format: int64 */
            id?: number;
            nombre?: string;
        };
        RespuestaIngreso: {
            /** @description Token de sesión. Se entrega una sola vez. */
            token?: string;
            usuario?: components["schemas"]["UsuarioActual"];
        };
        ResultadoCargaVista: {
            errores?: components["schemas"]["ErrorCarga"][];
            resumen?: components["schemas"]["Resumen"];
            valido?: boolean;
        };
        ResultadoTrm: {
            detalle?: string;
            /** Format: date */
            fecha?: string;
            /** @enum {string} */
            resultado?: "EXITO" | "FALLO" | "OMITIDA";
            /**
             * Format: decimal
             * @example 19.5000
             */
            valor?: string;
        };
        Resumen: {
            /** Format: int32 */
            clientes?: number;
            /** Format: int32 */
            productos?: number;
            /** Format: int32 */
            productosConStock?: number;
            /** Format: int32 */
            proveedores?: number;
            valorUsd?: components["schemas"]["Dinero"];
        };
        ResumenCobroVista: {
            costo?: components["schemas"]["MontoEnMonedas"];
            descuento?: components["schemas"]["MontoEnMonedas"];
            manoDeObra?: components["schemas"]["MontoEnMonedas"];
            material?: components["schemas"]["MontoEnMonedas"];
            /**
             * Format: decimal
             * @example 19.5000
             */
            porcentajeUtilidad?: string;
            subtotal?: components["schemas"]["MontoEnMonedas"];
            total?: components["schemas"]["MontoEnMonedas"];
            utilidad?: components["schemas"]["MontoEnMonedas"];
        };
        SeguimientoCotizacionVista: {
            mensaje?: string;
            whatsappUrl?: string;
        };
        SerialVendido: {
            /** Format: int64 */
            id?: number;
            numero?: string;
            /** Format: date */
            vencimientoGarantia?: string;
        };
        SerialVista: {
            documentoEntrada?: components["schemas"]["DocumentoRef"];
            documentoSalida?: components["schemas"]["DocumentoRef"];
            estado?: string;
            /** Format: date */
            fechaEntrada?: string;
            /** Format: int64 */
            id?: number;
            numero?: string;
            producto?: components["schemas"]["ProductoReferencia"];
            /** Format: date */
            vencimientoGarantia?: string;
        };
        SerialesPorEstado: {
            /** Format: int64 */
            anulados?: number;
            /** Format: int64 */
            dadosDeBaja?: number;
            /** Format: int64 */
            enBodega?: number;
            /** Format: int64 */
            instalados?: number;
            /** Format: int64 */
            vendidos?: number;
        };
        SolicitudAjuste: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            costoUnitarioUsd?: string;
            descripcion?: string;
            /** @enum {string} */
            motivo: "PERDIDA" | "DANO" | "CONTEO_FISICO" | "GARANTIA" | "OTRO";
            /** Format: int64 */
            productoId: number;
            seriales?: string[];
        };
        SolicitudAnulacion: {
            motivo: string;
        };
        SolicitudAnulacionInstalacion: {
            motivo: string;
        };
        SolicitudAnulacionVenta: {
            motivo: string;
        };
        SolicitudCambioContrasena: {
            confirmacion: string;
            contrasenaActual: string;
            contrasenaNueva: string;
        };
        SolicitudCategoria: {
            nombre: string;
            /** Format: int64 */
            version: number;
        };
        SolicitudCliente: {
            ciudad?: string;
            /** Format: email */
            correo?: string;
            direccion?: string;
            nombre: string;
            numeroDocumento?: string;
            telefono: string;
            /** @enum {string} */
            tipo: "INSTALADOR" | "CLIENTE_FINAL";
            /** @enum {string} */
            tipoDocumento?: "CC" | "NIT";
            /** Format: int64 */
            version: number;
        };
        SolicitudCompra: {
            /** Format: date */
            fecha?: string;
            lineas: components["schemas"]["SolicitudLineaCompra"][];
            /** @enum {string} */
            moneda: "USD" | "COP" | "VES";
            numeroFactura: string;
            /** Format: int64 */
            proveedorId: number;
        };
        SolicitudConfiguracion: {
            condicionesGarantia: string;
            empresaCiudad?: string;
            /** Format: email */
            empresaCorreo?: string;
            empresaLema?: string;
            empresaNit?: string;
            empresaNombre: string;
            empresaTelefono?: string;
            /** Format: int32 */
            garantiaEquiposMeses: number;
            /** Format: int32 */
            garantiaManoObraMeses: number;
            /**
             * Format: decimal
             * @example 19.5000
             */
            limiteVariacionTasa: string;
            piePdf: string;
            /** Format: int32 */
            validezCotizacionDias: number;
            /** Format: int64 */
            version: number;
        };
        SolicitudCorreccionTasa: {
            aceptarVariacion?: boolean;
            /**
             * Format: decimal
             * @example 19.5000
             */
            confirmacion: string;
            motivo?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valor: string;
        };
        SolicitudCotizacion: {
            /** Format: int64 */
            clienteId: number;
            descripcion?: string;
            /** @enum {string} */
            descuentoTipo?: "PORCENTAJE" | "VALOR";
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            lineas?: components["schemas"]["SolicitudLineaCotizacion"][];
            /**
             * Format: decimal
             * @example 19.5000
             */
            manoDeObra?: string;
            /** @enum {string} */
            moneda: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            /** @enum {string} */
            tipo: "VENTA" | "INSTALACION";
            /** Format: int32 */
            validezDias?: number;
            /** Format: int64 */
            version: number;
        };
        SolicitudEdicionInstalacion: {
            condicionesGarantia?: string;
            descripcion?: string;
            direccion?: string;
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            tecnicos: number[];
            /** Format: int64 */
            version: number;
        };
        SolicitudEdicionVenta: {
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            /** Format: int64 */
            version: number;
        };
        SolicitudIngreso: {
            contrasena: string;
            /** Format: email */
            correo: string;
        };
        SolicitudInstalacion: {
            /** Format: int64 */
            clienteId: number;
            condicionesGarantia?: string;
            /** Format: int64 */
            cotizacionId?: number;
            descripcion: string;
            /** @enum {string} */
            descuentoTipo?: "PORCENTAJE" | "VALOR";
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            direccion?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int32 */
            garantiaManoObraMeses?: number;
            lineas?: components["schemas"]["SolicitudLineaMaterial"][];
            /**
             * Format: decimal
             * @example 19.5000
             */
            manoDeObra?: string;
            /** @enum {string} */
            moneda: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            tecnicos: number[];
        };
        SolicitudLineaCompra: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            costoUnitario: string;
            /** Format: int64 */
            productoId: number;
            seriales?: string[];
        };
        SolicitudLineaCotizacion: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            precioUnitario?: string;
            /** Format: int64 */
            productoId: number;
        };
        SolicitudLineaMaterial: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            precioUnitario?: string;
            /** Format: int64 */
            productoId: number;
            seriales?: string[];
        };
        SolicitudLineaVenta: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            cantidad?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            precioUnitario?: string;
            /** Format: int64 */
            productoId: number;
            seriales?: string[];
        };
        SolicitudNuevoUsuario: {
            confirmacion: string;
            contrasena: string;
            /** Format: email */
            correo: string;
            nombre: string;
        };
        SolicitudProducto: {
            /** Format: int64 */
            categoriaId: number;
            codigo: string;
            controlaSerial: boolean;
            descripcion?: string;
            marca?: string;
            modelo?: string;
            /** @enum {string} */
            monedaPrecio?: "USD" | "COP" | "VES";
            nombre: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            precioClienteFinal: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            precioInstalador: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            stockMinimo?: string;
            /** Format: int64 */
            unidadMedidaId: number;
            /** Format: int64 */
            version: number;
        };
        SolicitudProveedor: {
            ciudad?: string;
            /** Format: email */
            correo?: string;
            /** @enum {string} */
            monedaHabitual: "USD" | "COP" | "VES";
            nit?: string;
            nombre: string;
            telefono?: string;
            /** Format: int64 */
            version: number;
        };
        SolicitudRechazo: {
            detalle?: string;
            /** @enum {string} */
            motivo?: "PRECIO" | "COMPETENCIA" | "OTRO";
        };
        SolicitudReclamo: {
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            instalacionId?: number;
            problema: string;
            /** Format: int64 */
            serialId?: number;
            solucion?: string;
        };
        SolicitudRestablecerContrasena: {
            confirmacion: string;
            contrasenaNueva: string;
        };
        SolicitudSolucion: {
            solucion?: string;
            /** Format: int64 */
            version: number;
        };
        SolicitudTasaManual: {
            aceptarVariacion?: boolean;
            /**
             * Format: decimal
             * @example 19.5000
             */
            confirmacion: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valor: string;
        };
        SolicitudUnidadMedida: {
            abreviatura: string;
            admiteDecimales: boolean;
            nombre: string;
            /** Format: int64 */
            version: number;
        };
        SolicitudVenta: {
            /** Format: int64 */
            clienteId: number;
            /** Format: int64 */
            cotizacionId?: number;
            /** @enum {string} */
            descuentoTipo?: "PORCENTAJE" | "VALOR";
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            lineas: components["schemas"]["SolicitudLineaVenta"][];
            /** @enum {string} */
            moneda: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
        };
        SolicitudVistaPrevia: {
            /** @enum {string} */
            par: "USD_COP" | "USD_VES";
            /** Format: int64 */
            tasaId?: number;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valor: string;
        };
        SolicitudVistaPreviaCompra: {
            /** Format: date */
            fecha?: string;
            lineas: components["schemas"]["SolicitudLineaCompra"][];
            /** @enum {string} */
            moneda: "USD" | "COP" | "VES";
        };
        TasaVigenteVista: {
            aviso?: string;
            esDeHoy?: boolean;
            /** Format: date */
            fecha?: string;
            /** @enum {string} */
            fuente?: "SUPERFINANCIERA" | "MANUAL";
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            par?: "USD_COP" | "USD_VES";
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valor?: string;
        };
        TasaVista: {
            correcciones?: components["schemas"]["CorreccionVista"][];
            /** Format: date */
            fecha?: string;
            /** @enum {string} */
            fuente?: "SUPERFINANCIERA" | "MANUAL";
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            par?: "USD_COP" | "USD_VES";
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            valor?: string;
        };
        TasasCompraVista: {
            /** Format: date */
            fechaTasaVes?: string;
            /** Format: date */
            fechaTrm?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            tasaVes?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            trm?: string;
        };
        TasasDocumentoVista: {
            /** Format: date */
            fechaTasaVes?: string;
            /** Format: date */
            fechaTrm?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            tasaVes?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            trm?: string;
        };
        TasasVigentesVista: {
            bolivar?: components["schemas"]["TasaVigenteVista"];
            /** Format: date */
            hoy?: string;
            trm?: components["schemas"]["TasaVigenteVista"];
            trmAutomaticaFallo?: boolean;
        };
        TotalMoneda: {
            costo?: components["schemas"]["Dinero"];
            total?: components["schemas"]["Dinero"];
            utilidad?: components["schemas"]["Dinero"];
            /** Format: int64 */
            ventas?: number;
        };
        UltimaCompra: {
            consecutivo?: string;
            /** Format: date */
            fecha?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            tasaVes?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            trm?: string;
        };
        UnidadMedidaVista: {
            abreviatura?: string;
            admiteDecimales?: boolean;
            /** Format: int64 */
            id?: number;
            nombre?: string;
            /** Format: int64 */
            version?: number;
        };
        UsuarioActual: {
            correo?: string;
            /** Format: int64 */
            id?: number;
            nombre?: string;
        };
        UsuarioReferencia: {
            /** Format: int64 */
            id?: number;
            nombre?: string;
        };
        UsuarioVista: {
            activo?: boolean;
            correo?: string;
            /** Format: int64 */
            id?: number;
            nombre?: string;
            /** Format: int64 */
            version?: number;
        };
        VariacionVista: {
            /**
             * Format: decimal
             * @example 19.5000
             */
            anterior?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            limite?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            nueva?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            porcentaje?: string;
            superaLimite?: boolean;
        };
        VentaResumenVista: {
            cliente?: string;
            /** Format: int64 */
            clienteId?: number;
            consecutivo?: string;
            estado?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            productos?: string;
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            total?: components["schemas"]["Dinero"];
            totalUsd?: components["schemas"]["Dinero"];
            utilidad?: components["schemas"]["Dinero"];
        };
        VentaVista: {
            anulacion?: components["schemas"]["Anulacion"];
            cliente?: components["schemas"]["ClienteDocumentoVista"];
            consecutivo?: string;
            cotizacion?: components["schemas"]["CotizacionOrigenVista"];
            descuentoTipo?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            descuentoValor?: string;
            estado?: string;
            /** Format: date */
            fecha?: string;
            /** Format: int64 */
            id?: number;
            lineas?: components["schemas"]["Linea"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            monedasComprobante?: ("USD" | "COP" | "VES")[];
            observaciones?: string;
            /**
             * Format: decimal
             * @example 19.5000
             */
            porcentajeUtilidad?: string;
            /** Format: date-time */
            registradaEn?: string;
            registradaPor?: string;
            resumen?: components["schemas"]["ResumenCobroVista"];
            tasas?: components["schemas"]["TasasDocumentoVista"];
            total?: components["schemas"]["Dinero"];
            utilidad?: components["schemas"]["Dinero"];
            /** Format: int64 */
            version?: number;
        };
        VersionAnterior: {
            descripcion?: string;
            descuento?: components["schemas"]["Dinero"];
            /** Format: date */
            fecha?: string;
            lineas?: components["schemas"]["LineaAnterior"][];
            manoDeObra?: components["schemas"]["Dinero"];
            /** Format: int32 */
            numeroVersion?: number;
            /** Format: date-time */
            reemplazadaEn?: string;
            reemplazadaPor?: string;
            total?: components["schemas"]["Dinero"];
            /** Format: date */
            vence?: string;
        };
        VistaPreviaCompraVista: {
            avisos?: string[];
            /** Format: date */
            fecha?: string;
            lineas?: components["schemas"]["Linea"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            tasas?: components["schemas"]["TasasCompraVista"];
            total?: components["schemas"]["MontoEnMonedas"];
        };
        VistaPreviaCotizacionVista: {
            avisos?: string[];
            cliente?: components["schemas"]["ClienteDocumentoVista"];
            /** Format: date */
            fecha?: string;
            lineas?: components["schemas"]["LineaVistaPrevia"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            resumen?: components["schemas"]["ResumenCobroVista"];
            tasas?: components["schemas"]["TasasDocumentoVista"];
            tipo?: string;
            /** Format: int32 */
            validezDias?: number;
            /** Format: date */
            vence?: string;
        };
        VistaPreviaInstalacionVista: {
            avisos?: string[];
            cliente?: components["schemas"]["ClienteDocumentoVista"];
            direccion?: string;
            /** Format: date */
            fecha?: string;
            garantias?: components["schemas"]["GarantiasInstalacionVista"];
            lineas?: components["schemas"]["LineaVistaPrevia"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            puedeGuardar?: boolean;
            resumen?: components["schemas"]["ResumenCobroVista"];
            tasas?: components["schemas"]["TasasDocumentoVista"];
        };
        VistaPreviaVentaVista: {
            avisos?: string[];
            cliente?: components["schemas"]["ClienteDocumentoVista"];
            /** Format: date */
            fecha?: string;
            lineas?: components["schemas"]["LineaVistaPrevia"][];
            /** @enum {string} */
            moneda?: "USD" | "COP" | "VES";
            puedeGuardar?: boolean;
            resumen?: components["schemas"]["ResumenCobroVista"];
            tasas?: components["schemas"]["TasasDocumentoVista"];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type AjusteVista = components['schemas']['AjusteVista'];
export type Anulacion = components['schemas']['Anulacion'];
export type Aviso = components['schemas']['Aviso'];
export type CambioCostoVista = components['schemas']['CambioCostoVista'];
export type CargaInicialVista = components['schemas']['CargaInicialVista'];
export type CategoriaVista = components['schemas']['CategoriaVista'];
export type ClienteDocumentoVista = components['schemas']['ClienteDocumentoVista'];
export type ClienteVista = components['schemas']['ClienteVista'];
export type CompraResumenVista = components['schemas']['CompraResumenVista'];
export type CompraVista = components['schemas']['CompraVista'];
export type ConfiguracionVista = components['schemas']['ConfiguracionVista'];
export type ConversionCotizacionVista = components['schemas']['ConversionCotizacionVista'];
export type CorreccionVista = components['schemas']['CorreccionVista'];
export type CotizacionOrigenVista = components['schemas']['CotizacionOrigenVista'];
export type CotizacionResumenVista = components['schemas']['CotizacionResumenVista'];
export type CotizacionVista = components['schemas']['CotizacionVista'];
export type Dinero = components['schemas']['Dinero'];
export type DocumentoGenerado = components['schemas']['DocumentoGenerado'];
export type DocumentoRef = components['schemas']['DocumentoRef'];
export type EnlaceComprobante = components['schemas']['EnlaceComprobante'];
export type EnlaceComprobanteVista = components['schemas']['EnlaceComprobanteVista'];
export type EnlaceCotizacionVista = components['schemas']['EnlaceCotizacionVista'];
export type ErrorCarga = components['schemas']['ErrorCarga'];
export type Foto = components['schemas']['Foto'];
export type Fotos = components['schemas']['Fotos'];
export type GarantiaVista = components['schemas']['GarantiaVista'];
export type GarantiasInstalacionVista = components['schemas']['GarantiasInstalacionVista'];
export type HistorialClienteVista = components['schemas']['HistorialClienteVista'];
export type HistorialSerialVista = components['schemas']['HistorialSerialVista'];
export type InstalacionResumenVista = components['schemas']['InstalacionResumenVista'];
export type InstalacionVista = components['schemas']['InstalacionVista'];
export type InventarioVista = components['schemas']['InventarioVista'];
export type Linea = components['schemas']['Linea'];
export type LineaAnterior = components['schemas']['LineaAnterior'];
export type LineaVistaPrevia = components['schemas']['LineaVistaPrevia'];
export type ListadoComprasVista = components['schemas']['ListadoComprasVista'];
export type ListadoInstalacionesVista = components['schemas']['ListadoInstalacionesVista'];
export type ListadoVentasVista = components['schemas']['ListadoVentasVista'];
export type MontoEnMonedas = components['schemas']['MontoEnMonedas'];
export type Movimiento = components['schemas']['Movimiento'];
export type MovimientoKardexVista = components['schemas']['MovimientoKardexVista'];
export type PaginaAjusteVista = components['schemas']['PaginaAjusteVista'];
export type PaginaClienteVista = components['schemas']['PaginaClienteVista'];
export type PaginaCompraResumenVista = components['schemas']['PaginaCompraResumenVista'];
export type PaginaCotizacionResumenVista = components['schemas']['PaginaCotizacionResumenVista'];
export type PaginaGarantiaVista = components['schemas']['PaginaGarantiaVista'];
export type PaginaInstalacionResumenVista = components['schemas']['PaginaInstalacionResumenVista'];
export type PaginaMovimientoKardexVista = components['schemas']['PaginaMovimientoKardexVista'];
export type PaginaProducto = components['schemas']['PaginaProducto'];
export type PaginaProductoVista = components['schemas']['PaginaProductoVista'];
export type PaginaProveedorVista = components['schemas']['PaginaProveedorVista'];
export type PaginaTasaVista = components['schemas']['PaginaTasaVista'];
export type PaginaVentaResumenVista = components['schemas']['PaginaVentaResumenVista'];
export type ProblemDetail = components['schemas']['ProblemDetail'];
export type Producto = components['schemas']['Producto'];
export type ProductoInventarioVista = components['schemas']['ProductoInventarioVista'];
export type ProductoReferencia = components['schemas']['ProductoReferencia'];
export type ProductoVista = components['schemas']['ProductoVista'];
export type ProveedorVista = components['schemas']['ProveedorVista'];
export type Rechazo = components['schemas']['Rechazo'];
export type Reclamo = components['schemas']['Reclamo'];
export type ReclamoVista = components['schemas']['ReclamoVista'];
export type Referencia = components['schemas']['Referencia'];
export type RespuestaIngreso = components['schemas']['RespuestaIngreso'];
export type ResultadoCargaVista = components['schemas']['ResultadoCargaVista'];
export type ResultadoTrm = components['schemas']['ResultadoTrm'];
export type Resumen = components['schemas']['Resumen'];
export type ResumenCobroVista = components['schemas']['ResumenCobroVista'];
export type SeguimientoCotizacionVista = components['schemas']['SeguimientoCotizacionVista'];
export type SerialVendido = components['schemas']['SerialVendido'];
export type SerialVista = components['schemas']['SerialVista'];
export type SerialesPorEstado = components['schemas']['SerialesPorEstado'];
export type SolicitudAjuste = components['schemas']['SolicitudAjuste'];
export type SolicitudAnulacion = components['schemas']['SolicitudAnulacion'];
export type SolicitudAnulacionInstalacion = components['schemas']['SolicitudAnulacionInstalacion'];
export type SolicitudAnulacionVenta = components['schemas']['SolicitudAnulacionVenta'];
export type SolicitudCambioContrasena = components['schemas']['SolicitudCambioContrasena'];
export type SolicitudCategoria = components['schemas']['SolicitudCategoria'];
export type SolicitudCliente = components['schemas']['SolicitudCliente'];
export type SolicitudCompra = components['schemas']['SolicitudCompra'];
export type SolicitudConfiguracion = components['schemas']['SolicitudConfiguracion'];
export type SolicitudCorreccionTasa = components['schemas']['SolicitudCorreccionTasa'];
export type SolicitudCotizacion = components['schemas']['SolicitudCotizacion'];
export type SolicitudEdicionInstalacion = components['schemas']['SolicitudEdicionInstalacion'];
export type SolicitudEdicionVenta = components['schemas']['SolicitudEdicionVenta'];
export type SolicitudIngreso = components['schemas']['SolicitudIngreso'];
export type SolicitudInstalacion = components['schemas']['SolicitudInstalacion'];
export type SolicitudLineaCompra = components['schemas']['SolicitudLineaCompra'];
export type SolicitudLineaCotizacion = components['schemas']['SolicitudLineaCotizacion'];
export type SolicitudLineaMaterial = components['schemas']['SolicitudLineaMaterial'];
export type SolicitudLineaVenta = components['schemas']['SolicitudLineaVenta'];
export type SolicitudNuevoUsuario = components['schemas']['SolicitudNuevoUsuario'];
export type SolicitudProducto = components['schemas']['SolicitudProducto'];
export type SolicitudProveedor = components['schemas']['SolicitudProveedor'];
export type SolicitudRechazo = components['schemas']['SolicitudRechazo'];
export type SolicitudReclamo = components['schemas']['SolicitudReclamo'];
export type SolicitudRestablecerContrasena = components['schemas']['SolicitudRestablecerContrasena'];
export type SolicitudSolucion = components['schemas']['SolicitudSolucion'];
export type SolicitudTasaManual = components['schemas']['SolicitudTasaManual'];
export type SolicitudUnidadMedida = components['schemas']['SolicitudUnidadMedida'];
export type SolicitudVenta = components['schemas']['SolicitudVenta'];
export type SolicitudVistaPrevia = components['schemas']['SolicitudVistaPrevia'];
export type SolicitudVistaPreviaCompra = components['schemas']['SolicitudVistaPreviaCompra'];
export type TasaVigenteVista = components['schemas']['TasaVigenteVista'];
export type TasaVista = components['schemas']['TasaVista'];
export type TasasCompraVista = components['schemas']['TasasCompraVista'];
export type TasasDocumentoVista = components['schemas']['TasasDocumentoVista'];
export type TasasVigentesVista = components['schemas']['TasasVigentesVista'];
export type TotalMoneda = components['schemas']['TotalMoneda'];
export type UltimaCompra = components['schemas']['UltimaCompra'];
export type UnidadMedidaVista = components['schemas']['UnidadMedidaVista'];
export type UsuarioActual = components['schemas']['UsuarioActual'];
export type UsuarioReferencia = components['schemas']['UsuarioReferencia'];
export type UsuarioVista = components['schemas']['UsuarioVista'];
export type VariacionVista = components['schemas']['VariacionVista'];
export type VentaResumenVista = components['schemas']['VentaResumenVista'];
export type VentaVista = components['schemas']['VentaVista'];
export type VersionAnterior = components['schemas']['VersionAnterior'];
export type VistaPreviaCompraVista = components['schemas']['VistaPreviaCompraVista'];
export type VistaPreviaCotizacionVista = components['schemas']['VistaPreviaCotizacionVista'];
export type VistaPreviaInstalacionVista = components['schemas']['VistaPreviaInstalacionVista'];
export type VistaPreviaVentaVista = components['schemas']['VistaPreviaVentaVista'];
export type $defs = Record<string, never>;
export interface operations {
    listar_8: {
        parameters: {
            query?: {
                productoId?: number;
                desde?: string;
                hasta?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaAjusteVista"];
                };
            };
        };
    };
    registrar_5: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de guardar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudAjuste"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AjusteVista"];
                };
            };
        };
    };
    detalle_9: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AjusteVista"];
                };
            };
        };
    };
    descargar_1: {
        parameters: {
            query: {
                clave: string;
                expira: number;
                firma: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": string;
                };
            };
        };
    };
    listar_7: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CargaInicialVista"][];
                };
            };
        };
    };
    confirmar: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de guardar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CargaInicialVista"];
                };
            };
        };
    };
    plantilla: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": string;
                };
            };
        };
    };
    validar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultadoCargaVista"];
                };
            };
        };
    };
    listar_6: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoriaVista"][];
                };
            };
        };
    };
    crear_5: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCategoria"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoriaVista"];
                };
            };
        };
    };
    actualizar_7: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCategoria"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CategoriaVista"];
                };
            };
        };
    };
    eliminar_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    buscar_2: {
        parameters: {
            query?: {
                tipo?: "INSTALADOR" | "CLIENTE_FINAL";
                buscar?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaClienteVista"];
                };
            };
        };
    };
    crear_4: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCliente"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClienteVista"];
                };
            };
        };
    };
    detalle_5: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClienteVista"];
                };
            };
        };
    };
    actualizar_6: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCliente"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClienteVista"];
                };
            };
        };
    };
    historial_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HistorialClienteVista"];
                };
            };
        };
    };
    listar_5: {
        parameters: {
            query?: {
                proveedorId?: number;
                productoId?: number;
                desde?: string;
                hasta?: string;
                /** @description Incluir las anuladas en el listado (por defecto, sí) */
                incluirAnuladas?: boolean;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListadoComprasVista"];
                };
            };
        };
    };
    registrar_4: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de guardar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCompra"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompraVista"];
                };
            };
        };
    };
    vistaPrevia_4: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudVistaPreviaCompra"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VistaPreviaCompraVista"];
                };
            };
        };
    };
    detalle_8: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompraVista"];
                };
            };
        };
    };
    anular_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudAnulacion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompraVista"];
                };
            };
        };
    };
    cambiarFactura: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompraVista"];
                };
            };
        };
    };
    quitarFactura: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CompraVista"];
                };
            };
        };
    };
    descargar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
        };
    };
    obtener: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfiguracionVista"];
                };
            };
        };
    };
    actualizar_5: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudConfiguracion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfiguracionVista"];
                };
            };
        };
    };
    cambiarLogo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfiguracionVista"];
                };
            };
        };
    };
    quitarLogo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfiguracionVista"];
                };
            };
        };
    };
    listar_4: {
        parameters: {
            query?: {
                estado?: "BORRADOR" | "EN_EVALUACION" | "APROBADA" | "CONVERTIDA" | "RECHAZADA" | "VENCIDA";
                clienteId?: number;
                tipo?: "VENTA" | "INSTALACION";
                desde?: string;
                hasta?: string;
                porVencer?: boolean;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaCotizacionResumenVista"];
                };
            };
        };
    };
    registrar_3: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de guardar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCotizacion"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    vistaPrevia_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCotizacion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VistaPreviaCotizacionVista"];
                };
            };
        };
    };
    detalle_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    editar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCotizacion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    aprobar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    comprobante_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
        };
    };
    conversion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConversionCotizacionVista"];
                };
            };
        };
    };
    duplicar: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de duplicar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    enlace_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnlaceCotizacionVista"];
                };
            };
        };
    };
    enviar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    rechazar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["SolicitudRechazo"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CotizacionVista"];
                };
            };
        };
    };
    seguimiento: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeguimientoCotizacionVista"];
                };
            };
        };
    };
    consultar: {
        parameters: {
            query?: {
                estado?: "VIGENTE" | "POR_VENCER" | "VENCIDA";
                clienteId?: number;
                /** @description INSTALACION o VENTA */
                tipo?: string;
                /** @description Parte del número de serie */
                serial?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaGarantiaVista"];
                };
            };
        };
    };
    reclamos: {
        parameters: {
            query?: {
                instalacionId?: number;
                serialId?: number;
                clienteId?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReclamoVista"][];
                };
            };
        };
    };
    registrar_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudReclamo"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReclamoVista"];
                };
            };
        };
    };
    cambiarSolucion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudSolucion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReclamoVista"];
                };
            };
        };
    };
    listar_3: {
        parameters: {
            query?: {
                clienteId?: number;
                tecnicoId?: number;
                desde?: string;
                hasta?: string;
                /** @description Estado de la garantía de mano de obra */
                estadoGarantia?: "VIGENTE" | "POR_VENCER" | "VENCIDA";
                /** @description Incluir las anuladas en el listado (por defecto, sí) */
                incluirAnuladas?: boolean;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListadoInstalacionesVista"];
                };
            };
        };
    };
    registrar_1: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de guardar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudInstalacion"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstalacionVista"];
                };
            };
        };
    };
    vistaPrevia_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudInstalacion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VistaPreviaInstalacionVista"];
                };
            };
        };
    };
    detalle_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstalacionVista"];
                };
            };
        };
    };
    actualizar_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudEdicionInstalacion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstalacionVista"];
                };
            };
        };
    };
    anular_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudAnulacionInstalacion"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstalacionVista"];
                };
            };
        };
    };
    comprobante_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
        };
    };
    enlace_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnlaceComprobante"];
                };
            };
        };
    };
    agregarFoto: {
        parameters: {
            query: {
                grupo: "ANTES" | "DURANTE" | "DESPUES";
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstalacionVista"];
                };
            };
        };
    };
    quitarFoto_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
                fotoId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstalacionVista"];
                };
            };
        };
    };
    listar_9: {
        parameters: {
            query?: {
                categoriaId?: number;
                /** @description true: solo activos; false: solo inactivos; vacío: todos */
                activo?: boolean;
                buscar?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventarioVista"];
                };
            };
        };
    };
    detalle_7: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoInventarioVista"];
                };
            };
        };
    };
    historialCosto: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CambioCostoVista"][];
                };
            };
        };
    };
    kardex: {
        parameters: {
            query?: {
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaMovimientoKardexVista"];
                };
            };
        };
    };
    seriales: {
        parameters: {
            query?: {
                estado?: "EN_BODEGA" | "VENDIDO" | "INSTALADO" | "DADO_DE_BAJA" | "ANULADO";
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SerialVista"][];
                };
            };
        };
    };
    buscar_1: {
        parameters: {
            query?: {
                categoriaId?: number;
                /** @description true: solo activos; false: solo inactivos; vacío: todos */
                activo?: boolean;
                buscar?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaProductoVista"];
                };
            };
        };
    };
    crear_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudProducto"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    detalle_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    actualizar_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudProducto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    eliminar_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    activar_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    desactivar_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    cambiarFoto: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    archivo: Blob;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    quitarFoto: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductoVista"];
                };
            };
        };
    };
    buscar: {
        parameters: {
            query?: {
                buscar?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaProveedorVista"];
                };
            };
        };
    };
    crear_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudProveedor"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProveedorVista"];
                };
            };
        };
    };
    detalle_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProveedorVista"];
                };
            };
        };
    };
    actualizar_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudProveedor"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProveedorVista"];
                };
            };
        };
    };
    buscar_3: {
        parameters: {
            query: {
                numero: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SerialVista"][];
                };
            };
        };
    };
    historial_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HistorialSerialVista"];
                };
            };
        };
    };
    actual: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sesión activa */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioActual"];
                };
            };
            /** @description NO_AUTENTICADO */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    iniciar: {
        parameters: {
            query?: never;
            header?: {
                "User-Agent"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudIngreso"];
            };
        };
        responses: {
            /** @description Sesión iniciada */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RespuestaIngreso"];
                };
            };
            /** @description VALIDACION */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description CREDENCIALES_INVALIDAS */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    cerrar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sesión cerrada */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    historial: {
        parameters: {
            query?: {
                par?: "USD_COP" | "USD_VES";
                desde?: string;
                hasta?: string;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaginaTasaVista"];
                };
            };
        };
    };
    registrarTrm: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudTasaManual"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TasaVista"];
                };
            };
        };
    };
    consultarTrm: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResultadoTrm"];
                };
            };
        };
    };
    registrarBolivar: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudTasaManual"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TasaVista"];
                };
            };
        };
    };
    vigentes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TasasVigentesVista"];
                };
            };
        };
    };
    vistaPrevia_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudVistaPrevia"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VariacionVista"];
                };
            };
        };
    };
    detalle_6: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TasaVista"];
                };
            };
        };
    };
    corregir: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCorreccionTasa"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TasaVista"];
                };
            };
        };
    };
    listar_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnidadMedidaVista"][];
                };
            };
        };
    };
    crear_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudUnidadMedida"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnidadMedidaVista"];
                };
            };
        };
    };
    actualizar_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudUnidadMedida"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnidadMedidaVista"];
                };
            };
        };
    };
    eliminar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listar_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioVista"][];
                };
            };
        };
    };
    crear: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudNuevoUsuario"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioVista"];
                };
            };
        };
    };
    cambiarContrasena: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudCambioContrasena"];
            };
        };
        responses: {
            /** @description Contraseña cambiada */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description VALIDACION, CONTRASENA_NO_COINCIDE o CONTRASENA_DEBIL */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description CONTRASENA_ACTUAL_INCORRECTA */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    tecnicos: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioReferencia"][];
                };
            };
        };
    };
    activar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioVista"];
                };
            };
        };
    };
    desactivar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioVista"];
                };
            };
        };
    };
    restablecerContrasena: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudRestablecerContrasena"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsuarioVista"];
                };
            };
        };
    };
    listar: {
        parameters: {
            query?: {
                clienteId?: number;
                productoId?: number;
                desde?: string;
                hasta?: string;
                /** @description Incluir las anuladas en el listado (por defecto, sí) */
                incluirAnuladas?: boolean;
                /** @description Zero-based page index (0..N) */
                page?: number;
                /** @description The size of the page to be returned */
                size?: number;
                /** @description Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. Multiple sort criteria are supported. */
                sort?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ListadoVentasVista"];
                };
            };
        };
    };
    registrar: {
        parameters: {
            query?: never;
            header?: {
                /** @description Clave única por intento de guardar (RT-07) */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudVenta"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VentaVista"];
                };
            };
        };
    };
    vistaPrevia: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudVenta"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VistaPreviaVentaVista"];
                };
            };
        };
    };
    detalle: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VentaVista"];
                };
            };
        };
    };
    actualizar: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudEdicionVenta"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VentaVista"];
                };
            };
        };
    };
    anular: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SolicitudAnulacionVenta"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["VentaVista"];
                };
            };
        };
    };
    comprobante: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
        };
    };
    enlace: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EnlaceComprobanteVista"];
                };
            };
        };
    };
}
