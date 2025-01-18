<!--- This file is auto generated from module/manual/es/README.md -->
# Documentación del sistema para la versión 0.10.X

Este documento es una descripción en progreso del sistema CoC7. No es un tutorial sobre cómo usar FoundryVTT.

Necesitarás uno de los siguientes elementos para jugar el juego:

- Manual del Guardián de la 7ª edición de La Llamada de Cthulhu de EDGE/Chaosium
- Caja de Inicio de la 7ª edición de La Llamada de Cthulhu de EDGE/Chaosium
- Reglas de Inicio Rápido de la 7ª edición de La Llamada de Cthulhu de EDGE/Chaosium

El sistema automatiza la mayoría de las tareas y reglas regulares asociadas con la ejecución de un juego.

Varias secciones de las hojas de personaje tienen información emergente que aparece después de dos segundos; este retardo se puede cambiar en las opciones.

Esta documentación se puede abrir en Opciones del Juego -> Ayuda y Documentación -> Consulte el manual del sistema CoC7.

# Cambios recientes

Para ver la lista completa de cambios, consulta el [registro de cambios](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) en GitHub.

- [Sistema de identificación CoC](sistema_de_coc_id.md) - Se establece etiquetas en documentos, por ejemplo, i.skill.dodge para encontrar habilidades de Esquivar en los actores.
- Asistente de Investigador - Se utiliza elementos de identificación CoC para crear investigadores.
- [Reglas Pulp](#resumen-de-opciones) - Se implementa una regla opcional de Pulp Cthulhu para ignorar la edad al calcular la velocidad de movimiento.
- [Efectos activos](efectos.md) - Se agrega soporte para dados de bonificación/penalización al lanzar desde las hojas de personaje del actor.

# Secciones de descripción a continuación

Si es la primera vez, se recomienda leer también las siguientes secciones en esta página.

Foundry VTT se basa en actores y objetos. Este módulo incluye varios actores y objetos específicos del sistema, y algunos ejemplos se pueden encontrar en los compendios del sistema incluidos.

- [Resumen de actor](#resumen-de-actor)
- [Resumen de objetos](#resumen-de-objetos)
- [Resumen de opciones](#resumen-de-opciones)
- [Resumen de menú de escenas](#menú-de-escenas-de-la-llamada-de-cthulhu)
- [Atajos de teclado y ratón](#atajos-de-teclado-y-ratón)
- [Creación de tu primer investigador](primer_investigador.md)
- [Creación de personaje](creacion_de_personaje.md)

# Cómo utilizar el sistema

- [Efectos activos](efectos.md) - Un efecto activo modificará una característica(s), atributo(s), habilidad(es) del actor.
- [Importador de actores](importador_de_actores.md)
- Tipo de Actor: Personaje (POR HACER)
- Tipo de Actor: Contenedor (POR HACER)
- Tipo de Actor: Criatura (POR HACER)
- Tipo de Actor: PNJ (POR HACER)
- Creador de enlaces de chat (POR HACER)
- Modo de creación de personajes (POR HACER)
- [Combate](combate.md) (POR HACER)
- Fase de desarrollo (POR HACER)
- [Tipos de Objetos](objetos.md) (POR HACER)
- [Tipo de Item: Arquetipo](objeto_arquetipo.md) (POR HACER)
- [Tipo de Item: Libro](objeto_libro.md) (POR HACER)
- [Tipo de Item: Persecuciones](persecuciones.md)
- Tipo de Item: Item (POR HACER)
- [Tipo de Item: Ocupación](objeto_ocupacion.md)
- [Tipo de Item: Configuración](objeto_configuracion.md)
- [Tipo de Item: Habilidad](objeto_habilidad.md) (POR HACER)
- Tipo de Item: Hechizo (POR HACER)
- Tipo de Item: Estado (POR HACER)
- Tipo de Item: Talento (POR HACER)
- Tipo de Item: Arma (POR HACER)
- [Herramienta de Creación de Enlaces](ventana_de_creacion_de_enlaces.md)
- [Enlaces](enlaces.md) (POR HACER)
- Macros (POR HACER)
- Tiradas (POR HACER)
- [Cordura](cordura.md) (POR HACER)
- Iniciar Descanso (POR HACER)
- Ganancia de EXP (POR HACER)

# Resumen de actor

- _Personaje_ - Un personaje completo, generalmente un investigador. [_Ejemplo de Personaje_]
- _Contenedor_ - Un contenedor de inventario. [_Ejemplo de Contenedor_]
- _Criatura_ - Un personaje más simple, adecuado para criaturas. [_Ejemplo de Criatura_]
- _PNJ_ - Un personaje más simple, adecuado para PNJ. [_Ejemplo de PNJ_]

# Resumen de objetos

- _Arquetipo_ - Un conjunto de habilidades y otras estadísticas que implementan un arquetipo de Pulp Cthulhu. Estos no activan la automatización en el sistema. [_Ejemplo de Arquetipo_]
- _Libro_ - Un tomo arcano que puede contener hechizos y mejoras para el personaje.
- _Item_ - Un equipo o herramienta.
- _Ocupación_ - Un conjunto de habilidades y otras estadísticas que implementan una ocupación de Call of Cthulhu. [_Ejemplo de Ocupación_]
- _Configuración_ - Un conjunto de configuraciones predeterminadas para la creación de personajes, criaturas o PNJ. [_Ejemplo de Configuración_]
- _Habilidad_ - Una habilidad con un porcentaje base y algunas etiquetas. [_Ejemplo de Habilidad_]
- _Hechizo_ - Un hechizo mágico.
- _Estado_ - Una condición de fobia o manía. [_Ejemplo de Manía_]
- _Talento_ - Un poder especial para Pulp Cthulhu. Estos no activan la automatización en el sistema. [_Ejemplo de Talento_]
- _Arma_ - Un objeto con estadísticas de arma (esto incluye ataques desarmados). [_Ejemplo de Arma_]

# Resumen de opciones

Haz clic en la pestaña Opciones y luego, bajo el encabezado Opciones del juego, haz clic en Configurar ajustes.

Haz clic en Configuraciones del Sistema

- _Reglas Variantes/Opcionales_ - Aquí puedes activar reglas individuales de Pulp Cthulhu y otras reglas opcionales.
- _Configuraciones de Iniciativa_ - Configuraciones adicionales para la regla opcional de iniciativa.
- _Configuraciones de Tiradas_ - Opciones predeterminadas para las tiradas.
- _Configuraciones de Tarjetas de Chat_ - Configura los mensajes de chat.
- _Configuraciones de Escena_ - Configuraciones de Escena.
- _Configuraciones de Arte del Juego_ - Esto te permite establecer un ícono y mensaje de pausa personalizados.
- _Configuraciones de Hoja_ - Esto te permite cambiar las configuraciones de la hoja de personaje y el CSS opcional.
- _Configuraciones de Armas_ - Configuraciones de Armas.
- _Configuraciones de Desarrollador y Depuración_ - Estas configuraciones pueden afectar tu mundo cuando se lanzan nuevas actualizaciones, así que úsalas solo en mundos de prueba.
- _Configuraciones de Tabla de Tiradas_ - Cuando se realizan tiradas de cordura, el sistema puede realizar automáticamente una tirada por un episodio de locura. Puedes ver ejemplos en los compendios de Tablas de Tiradas de Cordura.

# Menú de escenas de La Llamada de Cthulhu

Para acceder a este menú, necesitarás tener una escena activa que se puede crear en el Directorio de Escenas. Estas opciones solo están disponibles para el Guardián.

- _Herramientas del Guardián_
  - _Fase de Desarrollo_: Cuando está activado, los jugadores pueden realizar tiradas de mejora para sus habilidades marcadas.
  - _Modo de Creación de Personajes_: Cuando está activado, los jugadores pueden distribuir puntos entre sus habilidades.
  - _Ganancia de EXP_: Cuando está activado, una habilidad se marcará para mejorar después de una tirada exitosa.
  - _Enviar una tirada ficticia a los jugadores_: Al hacer clic, los jugadores verán una tirada privada ficticia del Guardián.
  - _Iniciar Descanso_: Al hacer clic, elige personajes para realizar un descanso y tirar por ganancias de EXP.
- _¡Tirar!_: Se utiliza para tirar 1d100 con un umbral, dificultad y dados de bonificación o penalización.
- _Crear enlace_: Crea un enlace de tirada para que los jugadores hagan clic.

# Atajos de teclado y ratón

Hay muchos elementos en las hojas que activan una tirada de dados al hacer clic. Por lo general, se muestra un diálogo para solicitar al usuario una dificultad y un posible bono o penalización. Este comportamiento se modifica con los siguientes controles:

- Haz clic derecho en cualquier elemento tirable para incluirlo en una tirada opuesta. Mientras la tarjeta esté abierta, todas las tiradas hechas
  con clic derecho se añadirán a la tirada opuesta.
- Alt + Clic derecho en cualquier elemento tirable para incluirlo en una tirada combinada.
- Shift + Clic izquierdo en un elemento tirable hará una tirada sin solicitar dificultad o bono/penalización.
- Ctrl + Clic izquierdo en un elemento tirable creará una solicitud de tirada. Solo disponible para el Guardián.
- Alt + Clic izquierdo en la cordura solicitará al jugador la pérdida mínima y máxima de cordura.
