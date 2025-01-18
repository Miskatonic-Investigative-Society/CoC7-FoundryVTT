<!--- This file is auto generated from module/manual/es/enlaces.md -->
# Enlaces

- Los enlaces son una forma para que el Director de Juego (GM) solicite un lanzamiento (Característica, Atributo, Habilidad, pérdida de COR, Arma).
- Los enlaces pueden contener un efecto activo.
- Los enlaces se crean en el registro de chat. Cuando haces clic en un enlace, se activará una tirada para tu(s) personaje(s) controlado(s)/suplantado(s).
- Los enlaces se pueden incluir en cualquier editor, principalmente en entradas de diario.
- Los enlaces se pueden crear de 5 maneras:
  - Al escribirlo manualmente (lee los detalles a continuación).
  - Al hacer CTRL+click en cualquier elemento de la hoja (Característica, Atributo, habilidad, pérdida de COR).
  - Al arrastrar un elemento de la hoja (Característica, Atributo, habilidad (+CTRL)) a un editor (entrada de diario).
  - Al arrastrar mientras mantienes presionada la tecla CTRL un objeto (habilidad o arma) desde un compendio o un directorio de objetos a un editor. Cuando se crea un enlace de esta manera y se utiliza como GM, si tu personaje controlado no tiene el arma/habilidad, se te pedirá que crees el ítem correspondiente.
  - Al usar el compendio incluido escrito por Lozalojo.
- Los enlaces se pueden arrastrar desde el registro de chat a un editor.
- Cuando se crea un enlace, se abrirá la ventana de selección de dificultad/sanción. Mantén presionada la tecla SHIFT para omitir ese comportamiento.
- Cuando se crea un enlace, se verificará el modo de lanzamiento. Si el modo de lanzamiento está configurado como 'lanzamiento oculto del GM', el enlace se creará como oculto.
- Cuando se crea un enlace con una dificultad y una sanción, las ventanas de dificultad/sanción no aparecerán.
- Cuando se crea un enlace sin dificultad o sanción, las ventanas de dificultad/sanción aparecerán. Mantener presionada la tecla SHIFT acelerará el lanzamiento (regular/sin sanción).

## Escritura de enlaces

- Los enlaces deben escribirse utilizando la [herramienta de creación de enlaces](ventana_de_creacion_de_enlaces.md). La ventana de creación de enlaces es una herramienta para el GM. Se encuentra en la barra lateral izquierda.

Enlaces para mensajes de chat y editores de hojas (NPC, entradas de diario...).
El formato del enlace es `@coc7.TIPO_DE_SOLICITUD[OPCIONES]{TEXTO_A_MOSTRAR}`

- `TIPO_DE_SOLICITUD`:
  - `sanloss`: activa una tirada de COR; al fallar, propondrá deducir la COR correspondiente.
  - `check`: activa una tirada según las opciones.
  - `item`: activa el uso de un arma. Solo se pueden activar elementos del tipo arma.
- `OPCIONES: []` = opcional, predeterminado
  - `sanloss`:
    - `sanMax`: pérdida máxima de COR
    - `sanMin`: pérdida mínima de COR
  - `check`:
    - `type`: tipo de tirada (`characteristic`, `skill`, `attrib`).
    - `name`: nombre de la habilidad/característica/atributo.
    - [`blind`]: forzará una tirada oculta; si no está presente, la tirada dependerá del modo de lanzamiento seleccionado.
  - todas:
    - [`difficulty`]: `?` (oculta), `0` (regular), `+` (difícil), `++` (extrema), `+++` (crítica).
    - [`modifier`]: `-x` (x dados de penalización), `+x` (x dados de bonificación), `0` (sin modificador).
    - [`icon`]: ícono a usar ([font awesome](https://fontawesome.com/icons), `fas fa-dice`).
- `TEXT_TO_DISPLAY`: Nombre a mostrar; esto es opcional.

### Ejemplos

| Enlace                                                                                                  | Resultado                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]`                                          | {Pérdida de COR Difícil (-1) 1/1D6}                                       |
| `@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]`                                            | {Tirada de FUE Difícil (-1)}                                        |
| `@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]`                                            | {Tirada de Suerte Difícil (-1)}                                     |
| `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]` | {Tirada de Antropología Difícil (-1)} (con ícono)                   |
| `@coc7.sanloss[sanMax:1D6,sanMin:1]`                                                                    | {Pérdida de COR (-1) 1/1D6} (sin nombre, dificultad ni modificador)       |
| `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]`              | {Tirada de Antropología (+1)} (con ícono, sin nombre ni dificultad) |

### Uso de enlaces

- Puedes arrastrar/soltar enlaces desde el chat a las hojas y entre las hojas.
- Puedes arrastrar/soltar un enlace directamente en un token.
- Puedes arrastrar/soltar ítems y habilidades en una entrada de diario mientras mantienes presionada la tecla CTRL, esto creará la tirada correspondiente con dificultad regular y un modificador de 0.
- Puedes crear enlaces en el chat haciendo clic y manteniendo presionada la tecla CTRL desde cualquier hoja (Personaje/PNJ/Criatura) correspondiente a características/suerte/COR/Competencia/arma/Pérdida de COR.
  - Esto abrirá el diálogo de selección de sanción/dificultad. Hacer clic en el enlace generado activará la tirada con todos los parámetros.
  - Mantener presionada la tecla Shift no abrirá el diálogo de sanción/dificultad. Hacer clic en el enlace generado abrirá el diálogo de sanción/dificultad y luego activará la tirada.
