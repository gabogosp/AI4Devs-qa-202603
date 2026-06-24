# Rol
Actúa como QA Automation Engineer especializado en pruebas End-to-End de
interfaces web con Playwright.

# Objetivo
Crear y ejecutar pruebas E2E con Playwright que validen, desde la perspectiva
del usuario, que la pantalla de posiciones ("position") funciona correctamente:
tanto su carga visual como la interacción de mover candidatos entre fases del
proceso de contratación.

# Contexto
- La interfaz "position" ya fue creada previamente en este proyecto.
- Antes de escribir las pruebas, localiza en el código la pantalla de posiciones
  (componente, ruta y endpoints que consume) para derivar de ahí los selectores
  y datos reales; no asumas estructura que no exista.

# Alcance de la validación (sin agregar ni quitar)
1. **Carga visual de la página de posiciones**: la pantalla renderiza sus
   elementos clave (título de la posición, columnas/fases del proceso y las
   tarjetas de candidatos correspondientes).
2. **Interacción de mover candidatos entre fases**: un candidato puede moverse
   de una fase a otra (drag-and-drop o el mecanismo que implemente la UI) y el
   cambio se refleja en la interfaz.

# Restricciones
- Usa exclusivamente Playwright como framework de pruebas E2E.
- Prioriza selectores accesibles (getByRole / getByText / data-testid) sobre
  selectores frágiles (clases CSS, XPath posicional).
- No introduzcas cambios en el código de la aplicación salvo agregar
  `data-testid` mínimos si son imprescindibles para seleccionar elementos;
  si lo haces, decláralo explícitamente.
- No amplíes el alcance a otras pantallas ni a pruebas unitarias/integración:
  solo E2E de la pantalla de posiciones.
- Si falta información para ejecutar (URL base, cómo levantar la app, datos de
  prueba/seed, credenciales), detente y pregunta antes de inventar.

# Formato de salida
1. Ubicación y nombre de los archivos de prueba creados (p. ej.
   `e2e/position.spec.ts`) y de la config de Playwright si aplica.
2. El código de las pruebas, organizado en dos casos:
   - "carga visual de la pantalla de posiciones"
   - "mover un candidato entre fases"
3. Comandos exactos para instalar dependencias y ejecutar las pruebas.
4. Resultado de la ejecución (passed/failed) con la salida real de Playwright;
   si algo falla, repórtalo tal cual, sin maquillar.
///////////////////////////////////
# Rol
Actuá como ingeniero/a de automatización QA experto/a en Playwright + TypeScript,
escribiendo pruebas end-to-end (E2E) mantenibles y deterministas.

# Objetivo
Crear pruebas E2E con Playwright que validen DOS escenarios de la pantalla
"Position" (tablero de fases de contratación tipo kanban): la carga de la página
y el cambio de fase de un candidato por drag-and-drop, verificando tanto la UI
como la llamada al backend.

# Contexto
- La pantalla "Position" muestra columnas, una por cada fase del proceso de
  contratación, y tarjetas de candidatos ubicadas en la columna de su fase actual.
- Fases de EJEMPLO (NO asumir como exactas): Aplicado, Entrevista, Prueba Técnica,
  Oferta, Contratado, Rechazado.
- El cambio de fase se persiste con: PUT /candidate/:id

# Tarea

## Escenario 1 — Carga de la página de Position
La prueba debe verificar:
1. El título de la posición se muestra correctamente.
2. Se muestran las columnas correspondientes a cada fase del proceso.
3. Las tarjetas de los candidatos aparecen en la columna correcta según su fase actual.

## Escenario 2 — Cambio de fase de un candidato (drag-and-drop)
La prueba debe:
1. Arrastrar una tarjeta de candidato desde una columna hacia otra.
2. Verificar que la tarjeta aparece visualmente en la nueva columna.
3. Interceptar y validar la petición al backend al soltar la tarjeta:
   - Se dispara una petición PUT a /candidate/:id.
   - El :id de la URL corresponde al candidato movido.
   - El body de la petición contiene la nueva fase.
   - La respuesta del backend es exitosa (status 2xx).

# Restricciones (guardrails)
- Las fases, el título y los textos usados en los selectores deben COINCIDIR con
  lo realmente implementado en la interfaz; NO inventar nombres de fases ni textos.
  Si un dato exacto no se conoce, dejarlo señalado como TODO en vez de adivinarlo.
- Preferir selectores estables (roles ARIA, getByRole/getByText, data-testid) por
  sobre selectores frágiles (clases CSS, XPath posicional).
- Interceptar la red con page.route / waitForRequest / waitForResponse para
  afirmar método, URL (:id), body y status — no inferir el resultado solo por la UI.
- Pruebas deterministas: sin esperas fijas (evitar waitForTimeout); usar
  auto-waiting / expect con web-first assertions.
- No agregar escenarios fuera de los dos pedidos.

# Formato de salida
- Un archivo de prueba en: tests/e2e/position.spec.ts
- Playwright Test + TypeScript, con dos test() (uno por escenario) agrupados en un
  describe(). Incluir los comentarios mínimos necesarios.
- Si hace falta configuración (baseURL, fixtures, datos de prueba), indicarla
  aparte de forma breve.
- Devolver solo el código de la prueba (y la config mínima si aplica), sin
  explicaciones largas.