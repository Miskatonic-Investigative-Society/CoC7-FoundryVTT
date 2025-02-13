<!--- This file is auto generated from module/manual/es/creacion_de_personaje.md -->
# Creación de personajes

El sistema incluye algunos compendios listos para que los personalices. Estos se restablecen cada vez que actualizas o instalas el sistema, por lo que se recomienda que los copies en tu propio compendio y los edites según sea necesario.

# Habilidades

En esta sección, crearás o editarás [habilidades](objeto_habilidad.md).

1. Ve a los paquetes de compendios.
2. Haz clic en Crear Compendio.

   - Dale un nombre a tu compendio (por ejemplo, `Mis Habilidades`).
   - Selecciona _Objeto_ como _Tipo de Entidad_.

## Usar habilidades existentes

1. Abre el compendio Habilidades.
2. Arrastra cualquier habilidad que desees personalizar a tu nuevo compendio.

## Crear nuevas habilidades

1. Ve al directorio de Objetos.
2. Haz clic en Crear objeto.

   - Dale un nombre a la habilidad.
   - Establece _Tipo_ como _Habilidad_.

# Configuración

[Configuraciones](objeto_configuracion.md) son conjuntos predefinidos de habilidades y una forma de generar las características (esto puede ser mediante el lanzamiento de dados o asignando una cierta cantidad de puntos, por ejemplo). Una vez creada una configuración, se puede utilizar en la creación de varios personajes.

1. Ve al directorio de Objetos.
2. Haz clic en Crear objeto.

   - Dale un nombre a la configuración.
   - Establece _Tipo_ como _Configuración_.

3. Define la configuración para establecer los parámetros básicos para un tipo de personaje.
   - Puedes añadir una descripción textual en la pestaña _Descripción_.
   - Si haces clic en el _icono_, puedes seleccionar uno nuevo.
   - En la pestaña _Detalles_, puedes:
       - Seleccionar las _Épocas de Cthulhu_ donde esta configuración es válida.
       - Definir las secciones de biografía y sus nombres (haz clic en el `+` para añadir secciones de biografía adicionales).
       - Arrastrar elementos predeterminados como [_Golpe_].
       - Mostrar/Ocultar la pestaña _Características_ con la casilla de verificación _Habilitar características_.
   - La pestaña _Características_ te permite definir la fórmula para lanzar los dados de cada característica.
   - La pestaña _Habilidades_ te permite definir el conjunto predeterminado de habilidades arrastrando elementos de tipo _habilidad_ al área de _Habilidades comunes_.

# Ocupaciones

Una [ocupación](objeto_ocupacion.md) ayuda a definir el trasfondo del personaje, piensa en ello como la definición del conjunto de _habilidades ocupacionales_ (aquellas donde el personaje puede gastar sus puntos de ocupación) más la definición de cómo calcular la cantidad de puntos de ocupación disponibles. Finalmente, la _ocupación_ también permite definir el mínimo y el máximo de _Crédito_ para un personaje con esta _ocupación_.

Ten en cuenta que el conjunto de _habilidades ocupacionales_ no necesita ser fijo, el sistema permite configurar la _ocupación_ para que, cuando se arrastre a una hoja de personaje, dé la opción de seleccionar una o más habilidades de una lista cerrada, o incluso añadir un número predefinido de habilidades para seleccionar de todas las disponibles.

El proceso de creación de la _ocupación_ es el siguiente:

1. Ve al directorio de Objetos.
2. Haz clic en Crear objeto.

   - Dale un nombre a la ocupación.
   - Establece _Tipo_ como _Ocupación_.

3. Define la _ocupación_ para seleccionar las características relevantes y las habilidades de ocupación.
   - Puedes añadir una descripción textual en la pestaña _Descripción_ y definir la _Fuente_.
   - Si haces clic en el _icono_, puedes seleccionar uno nuevo.
   - En la pestaña _Detalles_, puedes:
       - Seleccionar el _Tipo de Ocupación_.
       - Definir las características utilizadas para calcular los _puntos de ocupación_; puedes marcar las características que desees y definir el multiplicador. Para aquellas marcadas como _Opcionales_, el jugador deberá elegir una en el momento de la creación.

           Por ejemplo, si una ocupación utiliza _EDU * 2 + (FUE o DEX) * 2_, debes seleccionar _Educación_ y poner _2_ en el _Multiplicador_ sin marcar Opcional, y luego para Fuerza y Destreza, debes marcar ambas, marcar Opcional en ambas, y poner 2 en el Multiplicador en ambas.

        - Finalmente, deberás definir los valores _Mínimo_ y _Máximo_ para la habilidad _Calificación Crediticia_ de esta ocupación.
    - La pestaña _Habilidades_ te permite seleccionar las habilidades de ocupación arrastrando elementos del Tipo _habilidad_ a las diferentes secciones. Una ocupación típica tiene 8 habilidades más la habilidad _Calificación Crediticia_.
        - La sección _Habilidades comunes_ incluye las habilidades de ocupación predeterminadas que no se pueden cambiar.
        - La sección _Grupos de Habilidades Opcionales_ permite añadir grupos (puedes crear varios) de habilidades para que el jugador elija. Una vez que haces clic en el signo +, se crea un grupo y puedes definir el _Número a Elegir_ (número de habilidades para seleccionar) y crear un conjunto de habilidades disponible para la selección arrastrándolas al grupo.
        - Finalmente, la sección _Habilidades adicionales_ te permite ingresar un número de habilidades que el jugador puede elegir de las restantes habilidades disponibles.

# Creación de un _Personaje Jugador_

Puedes crear un _Personaje Jugador_ creando el _actor_ y completando la correspondiente _Hoja de Personaje_ en blanco, pero es mucho más fácil si has creado previamente una _configuración_ y una _ocupación_ (ver arriba). Si has creado ambos, el proceso para crear el _Personaje Jugador_ es el siguiente:

1. Ve al directorio de Actores.
2. Haz clic en Crear actor.

   - Dale un nombre al actor.
   - Establece _Tipo_ como _Personaje_.

3. Arrastra y suelta un objeto del Tipo _Configuración_ (por ejemplo, PJ 1920s, PJ Pulp, PJ Actual,...) en la hoja para hacer la configuración básica utilizando la configuración definida en el objeto. Esto suele incluir lanzar las características o establecer sus valores con el sistema de puntos, y establecer un conjunto predeterminado de habilidades correspondientes a la configuración dada.

4. Arrastra y suelta un ítem Tipo _Ocupación_ en la hoja, esto probablemente implicará seleccionar algunas habilidades de un conjunto reducido o de las restantes. Esto calculará los _puntos intereses particulares_ y _puntos de ocupación_ disponibles y asignará la parte de los puntos de ocupación para alcanzar el valor mínimo de _Crédito_ de la ocupación seleccionada.

5. En el menú del Guardián a la izquierda, haz clic en _Herramientas del Guardián_, si este menú no está disponible, debes tener una escena activa que se puede crear en la pestaña de Escenas.

6. En el nuevo submenú, haz clic en _Modo de Creación de Personajes_. Debería aparecer una nueva pestaña llamada _Desarrollo_ en las hojas de personaje.

7. Haz clic en la pestaña de _Desarrollo_ de los personajes.

8. La primera columna de puntos es para tus habilidades ocupacionales, estas se pueden alternar haciendo clic en ellas.
   - Si has habilitado la regla de arquetipos de Pulp, tendrás un segundo punto para alternar eso.

9. Distribuye los puntos de ocupación y de intereses particulares en la pestaña de desarrollo teniendo en cuenta que cada habilidad tiene 5 columnas:
    1. La primera es el porcentaje básico de la habilidad.
    2. La segunda es para colocar los puntos de interés personal durante la creación del personaje.
    3. La tercera solo está disponible para las habilidades de ocupación (marcadas con un círculo oscuro antes del nombre de la habilidad) y se usa para asignar los puntos de ocupación.
        - Si has habilitado la regla de arquetipos de Pulp, tendrás una cuarta columna para ingresar tus puntos de arquetipo aquí.
    4. La cuarta o quinta columna debería estar inicialmente en blanco y es donde aparecerán los puntos de experiencia (también puedes asignar puntos aquí si estás jugando con un personaje experimentado).
    5. La columna final es de solo lectura y muestra el valor final calculado para la habilidad (la suma de las demás columnas).

- [Video que muestra el proceso de creación de personajes](https://www.youtube.com/watch?v=VsQZHVXFwlk)
