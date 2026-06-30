# POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES

**Ley N° 29733 — Ley de Protección de Datos Personales**  
**Decreto Supremo N° 003-2013-JUS — Reglamento**  
**Última actualización:** 10 de junio de 2026 | **Versión:** 1.5

## 1. MARCO NORMATIVO

La presente Política desarrolla el tratamiento de datos personales en la Plataforma de gestión deportiva, en cumplimiento de:

- **Constitución Política del Perú**, artículo 2, numeral 6 (protección de datos personales).
- **Ley N° 29733** — Ley de Protección de Datos Personales.
- **D.S. N° 003-2013-JUS** — Reglamento de la Ley N° 29733.
- **Ley N° 27337** — Código de los Niños y Adolescentes (tratamiento de menores).
- Normas deportivas y de consumo aplicables supletoriamente.

Documento complementario: [Términos y Condiciones](/terminos/).

## 2. IDENTIDAD Y DOMICILIO (ART. 18 LEY N° 29733)

Conforme al **derecho de información** del titular (artículo 18 de la Ley N° 29733), se informa:

| Elemento | Información |
| --- | --- |
| Encargado del tratamiento (SaaS) | Xavier Urbano Rios Bardales |
| DNI | 42784003 |
| RUC | 10427840030 |
| Domicilio | Calle Jorge Chavez 1251, Iquitos, Loreto, Perú |
| WhatsApp (contacto y ARCO) | [+51 992 505 540](https://wa.me/51992505540) |

### 2.1. Roles en la arquitectura multi-liga

| Rol | Quién | Función |
| --- | --- | --- |
| **Titular del banco de datos** | Cada **Liga Deportiva** | Determina la finalidad del tratamiento respecto de sus jugadores, clubes y delegados |
| **Encargado del tratamiento** | **Xavier Urbano Rios Bardales** (Operador) | Provee infraestructura tecnológica, almacenamiento y procesamiento conforme a instrucciones de la liga (arts. 2 num. 7 y 17 de la Ley N° 29733) |

Las ligas que operan competiciones pueden inscribir sus bancos de datos ante el **MINJUSDH** cuando corresponda.

## 3. PRINCIPIOS RECTORES (TÍTULO I, LEY N° 29733)

Tratamos datos personales conforme a los principios de **legalidad, consentimiento, finalidad, proporcionalidad, calidad, seguridad** y **disposición de recurso** (artículo 4 y siguientes de la Ley N° 29733).

## 4. DATOS QUE RECOPILAMOS Y FINALIDAD

### 4.1. Datos de deportistas (mayores y menores de edad)

| Dato | Finalidad |
| --- | --- |
| Nombres, apellidos, fecha de nacimiento | Padrón deportivo, asignación de categoría (Sub 13, Sub 15, Sub 17, Mayores, etc.) |
| DNI u otro documento de identidad | Verificación de identidad, emisión de ficha y carnet |
| Fotografía | Carnet digital, control visual en mesa de juego y validación QR |
| Género, número de polo, club, categoría | Organización del torneo |
| Datos del apoderado (menores de edad) | Consentimiento y contacto de emergencia (art. 27 del Reglamento) |

**Finalidad exclusiva:** carnetización, control de identidad en competición, gestión logística del torneo y portales autorizados por la liga. **No** utilizamos estos datos para publicidad comercial ni cesión a terceros con fines de marketing.

### 4.2. Datos de usuarios del panel (delegados, administradores)

- Correo electrónico, identificador de usuario (UUID), rol, liga y club asignado.
- Metadatos de sesión y autenticación vía **Supabase Auth**.

### 4.3. Datos técnicos

- Dirección IP, agente de usuario, registros de seguridad y auditoría (logs).
- Cookies técnicas necesarias para sesión y protección del sistema (sección 9).

### 4.4. Datos que NO recopilamos

- Números de tarjeta de crédito o débito.
- Cuentas bancarias de jugadores o clubes.
- Metadatos de operaciones Yape/Plin (los pagos son **externos** a la Plataforma).
- Datos socioeconómicos o familiares del menor más allá de lo estrictamente necesario para el apoderado (art. 29 del Reglamento).

## 5. CARÁCTER OBLIGATORIO Y CONSECUENCIAS DE LA NEGATIVA (ART. 18 LEY N° 29733)

| Dato | ¿Obligatorio? | Consecuencia de la negativa |
| --- | --- | --- |
| DNI y fotografía del jugador | **Sí**, para identificación deportiva | Imposibilidad de emitir carnet digital y participar en partidos oficiales |
| Datos del apoderado (menores de edad) | **Sí** | El sistema no permite completar el registro sin ellos |
| Correo del delegado | **Sí**, para acceso al panel | No se puede operar el sistema |
| Teléfono del jugador | Facultativo | Sin impacto en carnetización |

La obligatoriedad responde únicamente a la **identificación deportiva y prevención de suplantación**, no a fines comerciales del Operador.

## 6. TRATAMIENTO DE DATOS DE MENORES DE EDAD

En cumplimiento del **artículo 13.3 de la Ley N° 29733** y los **artículos 27, 28 y 29 del Reglamento**:

### 6.1. Sin edad mínima y admisión de menores

La Plataforma **no establece una edad mínima** para el tratamiento de datos de deportistas. Cada liga o club define las categorías de su competición (por ejemplo U 11, Sub 13, Sub 15, Sub 17); el sistema **no bloquea** el registro por edad.

**Admite el registro de menores de edad** (personas menores de 18 años) en categorías formativas, conforme a las reglas de cada liga. Cuando el jugador es menor de edad, el sistema exige obligatoriamente los datos del apoderado (nombre, documento y teléfono), sin importar si tiene 6, 10, 12 o 17 años.

### 6.2. Consentimiento

- Para menores de edad, el tratamiento requiere el **consentimiento de los titulares de la patria potestad o tutores** (art. 27 del Reglamento).
- El registro es ejecutado por un **delegado o club** debidamente autorizado, quien declara contar con dicho consentimiento.
- Los menores entre **14 y 17 años** pueden comprender las condiciones de carnetización; el consentimiento del apoderado sigue siendo requisito del sistema para menores de 18 años (art. 28 del Reglamento).

### 6.3. Prohibiciones específicas (art. 29 del Reglamento)

- **No recopilamos** datos del entorno familiar o socioeconómico del menor (ocupación de padres, ingresos, etc.).
- Solo recabamos **identidad del menor**, **fotografía**, **DNI** y **datos del apoderado** estrictamente necesarios para el torneo.
- **No comercializamos** ni utilizamos datos de menores para marketing de terceros.
- Priorizamos el **interés superior del niño y del adolescente** (Ley N° 27337).

### 6.4. Datos biométricos (fotografías)

Las fotografías faciales pueden constituir **datos sensibles** conforme al artículo 2, numeral 5, de la Ley N° 29733. Su tratamiento se limita a la finalidad deportiva descrita y cuenta con el consentimiento del titular o de su representante legal, según corresponda.

## 7. TARIFAS Y PAGOS EXTERNOS (S/ 5.00 — YAPE / PLIN)

El costo del servicio por jugador activado es de **S/ 5.00 (cinco soles con 00/100)**, pagadero al Operador vía **Yape** o **Plin** de forma **externa** a la Plataforma.

Por esta razón **no tratamos datos financieros** de esas operaciones. Cualquier campo de «estado de pago» en el panel es un registro declarativo operativo, no certificación bancaria.

## 8. BASE LEGAL DEL TRATAMIENTO

| Finalidad | Fundamento |
| --- | --- |
| Crear cuentas y administrar el panel | Ejecución de contrato / consentimiento |
| Padrón deportivo y carnets | Consentimiento / interés legítimo de la liga |
| Seguridad, auditoría y rate limiting | Interés legítimo / obligación legal |
| Menores de edad | Consentimiento del apoderado (arts. 13.3, 27 Reglamento) |
| Cumplimiento normativo | Obligación legal |

## 9. COOKIES Y TECNOLOGÍAS SIMILARES

Utilizamos cookies técnicas estrictamente necesarias para:

- Mantener la sesión autenticada (Supabase).
- Recordar la liga activa en el panel operativo.
- Protección CSRF y seguridad básica.

**No** utilizamos cookies publicitarias ni de rastreo de terceros en el panel operativo.

## 10. PLAZO DE CONSERVACIÓN (ART. 18 LEY N° 29733)

| Tipo de dato | Plazo |
| --- | --- |
| Padrón activo | Mientras dure la relación deportiva y la liga mantenga la competición |
| Tras baja o retiro | Bloqueo y eliminación conforme a plazos legales y políticas de la liga |
| Logs de seguridad | Periodo limitado según necesidad operativa |
| Copias de respaldo | Periodo limitado en proveedores cloud |

## 11. DESTINATARIOS, ENCARGADOS Y FLUJO TRANSFRONTERIZO

### 11.1. Encargados de tratamiento

| Proveedor | Uso |
| --- | --- |
| Supabase | Base de datos, autenticación, almacenamiento de archivos |
| Vercel | Hosting de la aplicación |
| Upstash | Rate limiting (metadatos técnicos) |

### 11.2. Transferencia internacional (art. 15 Ley N° 29733)

Los datos pueden alojarse en servidores fuera del Perú (por ejemplo Estados Unidos). Adoptamos medidas contractuales y técnicas razonables (cifrado TLS, aislamiento por liga, políticas RLS) para garantizar un nivel de protección adecuado.

**No vendemos ni cedemos** datos personales a agencias publicitarias.

## 12. MEDIDAS DE SEGURIDAD (ARTS. 9 Y 16 LEY N° 29733)

- Control de acceso basado en roles (`LEAGUE_ADMIN`, `CLUB_DELEGATE`, etc.).
- Aislamiento lógico multi-tenant por `league_id`.
- Row Level Security (RLS) en PostgreSQL (según despliegue).
- Cifrado TLS en tránsito.
- Rate limiting en endpoints sensibles.
- Registro de auditoría en acciones críticas.
- Obligación de confidencialidad del personal y encargados con acceso (art. 17 Ley N° 29733).

### 12.1. Retención de registros técnicos

| Registro | Plazo de conservación | Purga |
| --- | --- | --- |
| Tabla `audit_events` (acciones de negocio) | **1 año** | Job mensual automático (pg_cron / Vercel Cron) |
| Logs de aplicación en Vercel (eventos `security`, `pii.*`) | **90 días** | Configurar drain / retención en el proveedor de logs |

## 13. DERECHOS DEL TITULAR — ARCO (TÍTULO III, LEY N° 29733)

El titular de datos personales (o su **representante legal**, en caso de menores) puede ejercer gratuitamente:

| Derecho | Descripción |
| --- | --- |
| **Acceso** | Conocer qué datos tratamos (art. 19) |
| **Rectificación** | Corregir datos inexactos (art. 20) |
| **Cancelación** | Solicitar supresión cuando proceda (art. 20) |
| **Oposición** | Oponerse en supuestos legales (art. 21) |
| **Revocación** | Revocar el consentimiento en cualquier momento, sin efecto retroactivo (art. 13.7) |

### 13.1. Cómo ejercer los derechos

**Canal principal:** **WhatsApp +51 992 505 540** — [escribir por WhatsApp](https://wa.me/51992505540?text=Hola%2C%20solicito%20ejercer%20mis%20derechos%20ARCO)  
**Canal alternativo:** directiva o administrador de su Liga (titular del banco de datos).

La solicitud debe incluir: nombres y apellidos, petición concreta, medio de contacto para notificaciones (WhatsApp o domicilio) y copia del DNI (art. 50 del Reglamento).

### 13.2. Plazos de respuesta (art. 55 del Reglamento)

| Derecho | Plazo máximo legal |
| --- | --- |
| Acceso | **Veinte (20) días hábiles** desde el día siguiente de la solicitud |
| Rectificación, cancelación u oposición | **Diez (10) días hábiles** desde el día siguiente de la solicitud |

### 13.3. Plazo operativo interno (ejecución técnica)

Una vez validada la identidad del titular (o representante legal), el **administrador de liga** o el **operador de la plataforma** ejecutará la solicitud en un plazo máximo de **quince (15) días calendario**, contados desde la recepción de la documentación completa.

| Acción técnica | Quién la ejecuta | Dónde |
| --- | --- | --- |
| **Exportación** (derecho de acceso) | `LEAGUE_ADMIN` o `SUPER_ADMIN` | Intranet → categoría del club → **Exportar ARCO** |
| **Anonimización** (cancelación) | `LEAGUE_ADMIN` o `SUPER_ADMIN` | Intranet → categoría del club → **Anonimizar ARCO** |

La exportación genera un archivo JSON con los datos personales del jugador, historial documental y metadatos de archivos adjuntos. La anonimización sustituye nombres y documento por valores irreversibles, elimina fotos en almacenamiento y depura snapshots históricos con datos personales. Cada operación queda registrada en el log de auditoría (`audit_events`).

Si no es debidamente atendido, puede recurrir ante la **Autoridad Nacional de Protección de Datos Personales** del Ministerio de Justicia y Derechos Humanos (**MINJUSDH**).

## 14. INCIDENTES DE SEGURIDAD

Ante incidentes que afecten datos personales, notificaremos a la Autoridad y a los titulares cuando la ley lo exija, conforme a los arts. 16 y 40 del Reglamento.

## 15. CAMBIOS A ESTA POLÍTICA

Publicaremos la versión actualizada con nueva fecha en esta URL. Los cambios sustanciales serán comunicados por medios razonables (aviso en portal o correo a administradores de liga).

## 16. CONTACTO

**Privacidad, protección de datos y derechos ARCO:**  
**WhatsApp +51 992 505 540** — [escribir por WhatsApp](https://wa.me/51992505540)

**Xavier Urbano Rios Bardales** — DNI 42784003 — RUC 10427840030  
Calle Jorge Chavez 1251, Iquitos, Loreto, Perú

---

*Documento informativo alineado al marco peruano (Ley N° 29733 y Reglamento). Se recomienda revisión legal personalizada e inscripción de bancos de datos ante el MINJUSDH cuando corresponda.*
