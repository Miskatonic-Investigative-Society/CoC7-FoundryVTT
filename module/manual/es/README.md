# Documentación del sistema para la versión 7.14

Este documento es una descripción general en progreso del sistema CoC7; no es un tutorial sobre cómo usar FoundryVTT.

Necesitarás uno de los siguientes elementos para jugar:

- Manual del Guardián de La Llamada de Cthulhu 7ª Edición de Chaosium
- Caja de Inicio de La Llamada de Cthulhu 7ª Edición de Chaosium
- Reglas de Inicio Rápido de La Llamada de Cthulhu 7ª Edición de Chaosium

El sistema automatiza la mayoría de las tareas y reglas habituales involucradas en la dirección de una partida.

Varias partes de las hojas de actor tienen descripciones emergentes que se activan después de dos segundos; este retraso se puede cambiar en la configuración.

Esta documentación se puede volver a abrir en [fas fa-cogs]Ajustes del Juego -> Ayuda y Documentación -> Ver manual del sistema CoC7.

# Cambios recientes

Para ver una lista completa de cambios, consulta el [registro de cambios](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) en GitHub.

 - Uso de [Compendios](compendios.md) para actualizar tu texto

# Módulos de Chaosium
- [Call of Cthulhu® - Starter Set](https://foundryvtt.com/packages/cha-coc-fvtt-en-starterset) - Contiene tres escenarios (Paper Chase, Edge of Darkness y Dead Man Stomp) e instrucciones para jugar a La Llamada de Cthulhu 7ª edición.
- [Call of Cthulhu® - Quick-Start Rules](https://foundryvtt.com/packages/cha-coc-fvtt-en-quickstart) - Contiene el escenario The Haunting y una guía para principiantes de FoundryVTT y La Llamada de Cthulhu 7ª edición.
- [Call of Cthulhu® - FoundryVTT - Investigator Wizard](https://foundryvtt.com/packages/call-of-cthulhu-foundryvtt-investigator-wizard) - Publicado con permiso de Chaosium, contiene arquetipos, ocupaciones, configuraciones y habilidades para usar con el Asistente de Creación de Investigadores.

# Secciones de resumen a continuación

Si es la primera vez, se recomienda que también leas las siguientes secciones en esta página.

Foundry VTT se basa en actores y objetos. Este módulo incluye una serie de actores y objetos específicos del sistema, y algunos ejemplos de ellos se pueden encontrar en los compendios del sistema incluidos.

- [Resumen de actor](#resumen-de-actor)
- [Resumen de objetos](#resumen-de-objetos)
- [Resumen de configuración](#resumen-de-configuración)
- [Resumen del menú de escena](#menú-de-escena-de-la-llamada-de-cthulhu)
- [Atajos de teclado y ratón](#atajos-de-teclado-y-ratón)
- [Crear tu primer investigador](primer_investigador.md)
- [Creación de personaje](creacion_de_personaje.md)

# Cómo usar el sistema

- [Efectos activos](efectos.md) - Un efecto activo modificará una característica(s), atributo(s) y/o habilidad(es) de un actor.
- [Importador de actores](importador_de_actores.md)
- Tipo de Actor: Personaje (POR HACER)
- Tipo de Actor: Contenedor (POR HACER)
- Tipo de Actor: Criatura (POR HACER)
- Tipo de Actor: PNJ (POR HACER)
- Creador de enlaces de chat (POR HACER)
- Modo de creación de personaje (POR HACER)
- [Combate](combate.md) (POR HACER)
- [Compendios](compendios.md)
- Fase de desarrollo (POR HACER)
- [Tipos de Objetos](objetos.md) (POR HACER)
- [Tipo de Objeto: Arquetipo](objeto_arquetipo.md) (POR HACER)
- [Tipo de Objeto: Libro](objeto_libro.md) (POR HACER)
- [Tipo de Objeto: Persecuciones](persecuciones.md)
- Tipo de Objeto: Objeto (POR HACER)
- [Tipo de Objeto: Ocupación](objeto_ocupacion.md)
- [Tipo de Objeto: Configuración](objeto_configuracion.md)
- [Tipo de Objeto: Habilidad](objeto_habilidad.md) (POR HACER)
- Tipo de Objeto: Hechizo (POR HACER)
- Tipo de Objeto: Estado (POR HACER)
- Tipo de Objeto: Talento (POR HACER)
- Tipo de Objeto: Arma (POR HACER)
- [Herramienta de Creación de Enlaces](ventana_de_creacion_de_enlaces.md)
- [Enlaces](enlaces.md) (POR HACER)
- Macros (POR HACER)
- Tiradas (POR HACER)
- [Cordura](cordura.md) (POR HACER)
- Iniciar Descanso (POR HACER)
- Ganancia de EXP (POR HACER)

# Resumen de actor

- _Personaje_ - Un personaje completo, usualmente un investigador. @Compendium[CoC7.examples.JuI2aWDSEuQNKeUI]{Personaje de ejemplo}
- _Contenedor_ - Un contenedor de inventario. @Compendium[CoC7.examples.r7bDSY4OYKxQYEas]{Contenedor de ejemplo}
- _Criatura_ - Un personaje más simple, adecuado para criaturas. @Compendium[CoC7.examples.XE2vjLG03wGfnYLw]{Criatura de ejemplo}
- _PNJ_ - Un personaje más simple, adecuado para PNJs. @Compendium[CoC7.examples.4kSvDc4n13oFx8RG]{PNJ de ejemplo}

# Resumen de objetos

- _Arquetipo_ - Un conjunto de habilidades y otras estadísticas que implementan un arquetipo de Pulp Cthulhu. Estos no activan automatización en el sistema. @Compendium[CoC7.items.lu04TIRrg9P3vRqY]{Arquetipo de ejemplo}
- _Libro_ - Un tomo arcano que puede contener hechizos y mejoras de personaje.
- _Objeto_ - Una pieza de equipo.
- _Ocupación_ - Un conjunto de habilidades y otras estadísticas que implementan una ocupación de CoC. @Compendium[CoC7.items.NOsh6EdNSjpjahDF]{Ocupación de ejemplo}
- _Configuración_ - Un conjunto de configuraciones por defecto para la creación de personajes, criaturas o PNJs. @Compendium[CoC7.items.CcH7CdXGtGTjMSCg]{Configuración de ejemplo}
- _Habilidad_ - Una habilidad con un porcentaje base y algunas etiquetas. @Compendium[CoC7.skills.UOuN0gESXPp2HXwH]{Habilidad de ejemplo}
- _Hechizo_ - Un hechizo mágico.
- _Estado_ - Una condición de fobia o manía. @Compendium[CoC7.en-wiki-phobias-and-manias.Item.RSBgVRZFUDDCNhXo]{Manía de ejemplo}
- _Talento_ -Un poder especial para Pulp Cthulhu. Estos no activan automatización en el sistema. @Compendium[CoC7.items.yqvwz769ZeJplOW7]{Talento de ejemplo}
- _Arma_ - Un objeto con estadísticas de arma (esto incluye ataques sin armas). @Compendium[CoC7.items.3elxAwnv7WCUNwng]{Arma de ejemplo}

# Resumen de ajustes

Haz clic en la pestaña de [fas fa-cogs]Ajustes y luego, bajo el encabezado Ajustes del juego, haz clic en [fas fa-cogs]Configurar ajustes.

Haz clic en [fas fa-cogs]Ajustes del sistema

- _Reglas Variantes/Opcionales_ - Aquí puedes activar reglas individuales de Pulp Cthulhu y otras reglas opcionales.
- _Ajustes de Iniciativa_ - Ajustes adicionales para la regla opcional de iniciativa.
- _Ajustes de Tirada_ - Opciones por defecto para las tiradas.
- _Ajustes de Tarjetas de Chat_ - Configura los mensajes de chat.
- _Ajustes de Escena_ - Ajustes de Escena.
- _Ajustes de Arte del Juego_ - Esto te permite establecer un icono y mensaje de pausa personalizados.
- _Ajustes de Hoja_ - Esto te permite cambiar los ajustes de la hoja de personaje y CSS opcional.
- _Ajustes de Arma_ - Ajustes de Arma.
- _Ajustes de Desarrollador y Depuración_ - Estos ajustes pueden romper tu mundo cuando se lancen nuevas actualizaciones, así que úsalos solo en mundos de prueba.
- _Ajustes de Tabla de Tiradas_ - Cuando se hacen tiradas de cordura, el sistema puede tirar automáticamente para un episodio de locura. Puedes ver tablas de tiradas de ejemplo en los compendios de Tablas de Tiradas de Cordura.

# Menú de escena de La Llamada de Cthulhu

Para acceder a este menú necesitarás tener una escena activa, que puede crearse en la pestañada de [fas fa-map]Escenas. Estas opciones solo están disponibles para el Guardián.

- _Herramientas del Guardián_
  - _Fase de desarrollo_: Cuando está activada, los jugadores pueden hacer tiradas de mejora para sus habilidades marcadas.
  - _Modo de creación de personaje_: Cuando está activado, los jugadores pueden distribuir puntos entre sus habilidades.
  - _Ganancia de EXP_: Cuando está activada, una habilidad se marcará para mejora después de una tirada exitosa.
  - _Enviar una tirada de señuelo a los jugadores_: Al hacer clic, los jugadores verán una tirada privada falsa del GM.
  - _Iniciar Descanso_: Al hacer clic, elige personajes para realizar un descanso y tirar por ganancias de EXP.
- _¡Tirar!_: Usado para tirar 1d100 con un umbral, dificultad y dados de bonificación o penalización.
- _Crear enlace_: Crea un enlace de tirada para que los jugadores hagan clic.

# Atajos de teclado y ratón

Hay muchos elementos en las hojas que activan una tirada de dados al hacer clic. Usualmente se muestra un diálogo para solicitar al usuario una dificultad y una posible bonificación o penalización. Este comportamiento se modifica con los siguientes controles:

- Haz clic derecho en cualquier elemento tirable para incluirlo en una tirada opuesta. Mientras la tarjeta esté abierta, todas las tiradas hechas
  con un clic derecho se añadirán a la tirada opuesta.
- Alt + Clic derecho en cualquier elemento tirable para incluirlo en una tirada combinada.
- Shift + Clic izquierdo en un elemento tirable hará una tirada sin preguntar por dificultad o bonificación/penalización.
- Ctrl + Clic izquierdo en un elemento tirable creará una solicitud de tirada. Solo disponible para el GM.
- Alt + Clic izquierdo en cordura solicitará al jugador la pérdida mínima y máxima de cordura.
