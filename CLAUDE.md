# 🏗️ Contexto General: Sistema de Control de Obra Edificio Victoria

## 📌 1. Visión General del Proyecto
- **Objetivo:** Aplicación web monolítica responsiva (`control_victoria_v9.html`) diseñada principalmente para uso en terreno (móvil/diseño oscuro) para la gestión del Edificio Victoria (Huérfanos 801).
- **Enfoque de Desarrollo:** Código limpio, JavaScript nativo (vanilla), estilos CSS integrados para modo oscuro (tarjetas, bordes azules/grises), y persistencia de datos local/simulada.

## 🗂️ 2. Mapa de Módulos y Lógica Existente
*(Revisar este historial antes de modificar código para no romper funciones críticas)*

* **📦 Módulo 1: Planificación Personalizada ("Plan Pers.")** — 🟡 `[En Progreso]`
    * *Lógica implementada en Ventanas:* Tracking expandido por unidad física (Ej: V25 x2 se visualiza como Unidad #1 y #2 por separado).
    * *Flujo de estados:* Estados base (Pendiente [amarillo] -> Rasgo OK [rosado] -> Medida OK -> En Tránsito [naranja]). Al llegar a obra se activan 3 sub-estados en paralelo con porcentajes (0%, 25%, 50%, 75%, 100%): Marco (café), Termopanel (azul), Quincallería (violeta). Requiere check de "Entrega a Calidad" para pasar a Completo (verde).
    * *Pasillos:* Actualizados con sus cantidades reales de ventanas por piso (P3: V27 x16, V27MOD x2; P4: V21 x16, V21MOD x2, etc.).
    * *Objetivo Actual:* Al pinchar un departamento en el listado de vencidos (ej: d209), desplegar este menú de partidas para poder asignar los avances y generar el PDF filtrado (ocultando opcionalmente las del 100%).

* **📊 Módulo 2: Informe y Generación de PDF Gantt** — 🟢 `[Estable]`
    * *Filtros Especiales:* Cuenta con la función `matchEspecialidad` que cruza tareas por `psIds` y responsable, resolviendo el desfase de tareas asignadas a "supervisor fase 2" que corresponden a Pintura.
    * *Forzado de Fechas (Fixes automáticos):* El código ya filtra/mueve automáticamente las tareas del Piso 6 de Ventanas (para que cierren en Julio) y de Pintura (para que cierren en Agosto), bloqueando que se muestren tareas en septiembre.
    * *Calendario Anual:* Pre-inicializa los 12 meses (Marzo a Diciembre con orden numérico de JS). Muestra meses vacíos en gris claro ("Sin tareas").

* **⏱️ Módulo 3: S.Tiempo y Registro de Gastos / Boletas** — 🟢 `[Estable]`
    * *Lógica:* Soporta un array de boletas (`boletasArr`). Permite adjuntar múltiples fotos/comprobantes a un mismo registro, añadirles descripción individual y ver miniaturas con opción de pantalla completa.

## 🛠️ 3. Reglas Estrictas para la IA
- **Regla de Oro:** NO intentes leer archivos pesados de la raíz como `.xlsx` o `.mpp` (Asistencias o Project). Concéntrate en la lógica interna del HTML.
- **Modularidad:** Modifica solo las funciones necesarias del renderizado o estado, sin alterar los parches de ordenamiento de fechas ni la estructura de los módulos estables.

## 🎯 4. Tarea Activa Actual
- **Módulo actual:** Módulo 1 ("Plan Pers.").
- **Objetivo inmediato:** Conectar el despliegue del menú de partidas en el departamento seleccionado (ej: d209) dentro de la vista "Plan Pers.", activar la edición de sus avances en pantalla y preparar la exportación a PDF con el switch del 100%.