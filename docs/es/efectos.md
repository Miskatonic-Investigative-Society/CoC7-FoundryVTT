<!--- This file is auto generated from module/manual/es/efectos.md -->
# Efectos

El sistema permite la creación de Efectos Activos.
Un efecto activo modificará las características, atributos o habilidades de un actor.
Los efectos pueden crearse como un [enlace](enlaces.md) utilizando la [herramienta de creación de enlaces](ventana_de_creacion_de_enlaces.md) o directamente en la hoja de personaje haciendo clic en el botón .

## Pestaña de Efectos

Los efectos se mostrarán en la pestaña Efectos de la hoja de personaje.

![pestaña de efectos](../../assets/manual/effects/effects-tab.webp)

Los efectos se dividen en 4 categorías para PC:

- Estado: estos son efectos usados y creados por el sistema (estado de heridas, propenso, loco...). Estos efectos no incluyen cambios.
- Temporales: estos son efectos con duración.
- Pasivos: estos son efectos permanentes.
- Inactivos: estos son efectos desactivados.

Para PNJ/Criaturas, solo verás 2 secciones: efectos activos e inactivos.
Cuando un efecto no está inactivo, los cambios correspondientes se aplicarán al actor.

## Creación de efectos

Puedes crear efectos haciendo clic en el botón Añadir.
Esto abrirá la ventana de creación de efectos.
Esta ventana tiene 3 pestañas.

### Pestaña de Detalles

![Pestaña de Detalles](../../assets/manual/effects/details-tab.webp)

### Pestaña de Duración

![Pestaña de Duración](../../assets/manual/effects/duration-tab.webp)

### Pestaña de Cambios

![Pestaña de Cambios](../../assets/manual/effects/changes-tab.webp)

Esta última pestaña incluirá todos los cambios realizados en la hoja de personaje.

## Cambios

Un efecto incluye una lista de cambios. Cada cambio debe abordarse con la ruta del sistema correspondiente.
Los cambios disponibles son:

- Características:
  - Fuerza:
    - system.characteristics.str.value
    - system.characteristics.str.bonusDice
  - Constitución:
    - system.characteristics.con.value
    - system.characteristics.con.bonusDice
  - Tamaño:
    - system.characteristics.siz.value
    - system.characteristics.siz.bonusDice
  - Destreza:
    - system.characteristics.dex.value
    - system.characteristics.dex.bonusDice
  - Apariencia:
    - system.characteristics.app.value
    - system.characteristics.app.bonusDice
  - Inteligencia:
    - system.characteristics.int.value
    - system.characteristics.int.bonusDice
  - Poder:
    - system.characteristics.pow.value
    - system.characteristics.pow.bonusDice
  - Educación:
    - system.characteristics.edu.value
    - system.characteristics.edu.bonusDice
- Atributos:
  - Suerte:
    - system.attribs.lck.value
    - system.attribs.lck.bonusDice
  - Cordura:
    - system.attribs.san.value
    - system.attribs.san.bonusDice
  - Movimiento:
    - system.attribs.mov.value
  - Corpulencia:
    - system.attribs.build.value
  - Bono de Daño:
    - system.attribs.db.value
  - Armadura:
    - system.attribs.armor.value
- Atributos derivados. Solo el valor máximo de esos atributos debe modificarse. Esos cambios se aplican después de que se hayan realizado todos los demás cambios. Si ese atributo está en modo automático, se volverá a calcular con los cambios de características anteriores antes de que se vea afectado su valor.
  - Puntos de vida:
    - system.attribs.hp.max
  - Cordura:
    - system.attribs.san.max
- Habilidades. ¡Las habilidades se identifican por sus nombres completos y distinguen entre mayúsculas y minúsculas!
  - Encanto
    - system.skills.Encanto.value
    - system.skills.Encanto.bonusDice
  - Combatir (Pelea)
    - system.skills.Combatir (Pelea).value
    - system.skills.Combatir (Pelea).bonusDice
