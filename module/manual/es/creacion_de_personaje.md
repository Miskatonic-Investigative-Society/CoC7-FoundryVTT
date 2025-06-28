# Creación de personajes

El sistema incluye algunos compendios listos para que los personalices. Estos se restablecen cada vez que actualizas o instalas el sistema, por lo que se recomienda que los copies en tu propio compendio y los edites según sea necesario.

# Habilidades

En esta sección, crearás o editarás [habilidades](objeto_habilidad.md).

1. Ve a la pestaña de [fas fa-atlas]Compendios.
2. Haz clic en [fas fa-atlas]Crear compendio.

   - Dale un nombre a tu compendio (por ejemplo, `Mis Habilidades`).
   - Establece _Tipo de documento_ como _Objeto_.

## Usar habilidades existentes

1. Abre el compendio Habilidades.
2. Arrastra cualquier habilidad que desees personalizar a tu nuevo compendio.

## Crear nuevas habilidades

1. Ve a la pestaña de [fas fa-suitcase]Objetos.
2. Haz clic en [fas fa-suitcase]Crear objeto.

   - Dale un nombre a la habilidad.
   - Establece _Tipo_ como _Habilidad_.

# Configuración

Las [Configuraciones](objeto_configuracion.md) son conjuntos predefinidos de habilidades y una forma de generar las características (esto puede ser tirando dados o asignando una cierta cantidad de puntos, por ejemplo). Una vez creada una configuración, se puede utilizar en la creación de varios personajes.

1. Ve a la pestaña de [fas fa-suitcase]Objetos.
2. Haz clic en [fas fa-suitcase]Crear objeto.

   - Dale un nombre a la configuración.
   - Establece _Tipo_ como _Configuración_.

3. Define la configuración para establecer los parámetros básicos para un tipo de personaje.
   - Puedes agregar una descripción textual en la pestaña de _Descripción_.
   - Si haces clic en el _icono_, puedes seleccionar uno nuevo.
   - En la pestaña de _Detalles_, puedes:
       - Seleccionar las _Épocas de Cthulhu_ donde esta configuración es válida.
       - Definir las secciones de transfondo y sus nombres (haz clic en el `+` para agregar secciones de transfondo adicionales).
       - Arrastrar objetos predeterminados como @Compendium[CoC7.items.3elxAwnv7WCUNwng]{Golpe}.
       - Mostrar/Ocultar la pestaña de _Características_ con la casilla de verificación _Habilitar características_.
   - La pestaña de _Características_ te permite definir la fórmula para lanzar los dados de cada característica.
   - La pestaña de _Habilidades_ te permite definir el conjunto predeterminado de habilidades arrastrando objetos de tipo _habilidad_ al área de _habilidades comunes_.

# Ocupaciones

Una [ocupación](objeto_ocupacion.md) ayuda a definir el trasfondo del personaje, piensa en ella como la definición del conjunto de _habilidades de ocupación_ (aquellas donde el personaje puede gastar sus puntos de ocupación) más la definición de cómo calcular la cantidad de puntos de ocupación disponibles. Finalmente, la _ocupación_ también permite definir el mínimo y el máximo de _Crédito_ para un personaje con esta _ocupación_.

Ten en cuenta que el conjunto de _habilidades de ocupación_ no necesita ser fijo, el sistema permite configurar la _ocupación_ para que, cuando se arrastre a una hoja de personaje, dé la opción de seleccionar una o más habilidades de una lista cerrada, o incluso agregar un número predefinido de habilidades para seleccionar entre todas las disponibles.

El proceso de creación de la _ocupación_ es el siguiente:

1. Ve a la pestaña de [fas fa-suitcase]Objetos.
2. Haz clic en [fas fa-suitcase]Crear objeto.

   - Dale un nombre a la ocupación.
   - Establece _Tipo_ como _Ocupación_.

3. Define la _ocupación_ para seleccionar las características relevantes y las habilidades de ocupación.
   - Puedes agregar una descripción textual en la pestaña de _Descripción_ y definir la _Fuente_.
   - Si haces clic en el _icono_, puedes seleccionar uno nuevo.
   - En la pestaña de _Detalles_, puedes:
       - Seleccionar el _Tipo de ocupación_.
       - Definir las características utilizadas para calcular los _Puntos de ocupación_; puedes marcar las características que desees y definir el multiplicador. Para aquellas marcadas como _A elegir_, el jugador deberá elegir una en el momento de la creación.

           Por ejemplo, si una ocupación utiliza _EDU * 2 + (FUE o DES) * 2_, debes seleccionar _Educación_ y poner _2_ en el _Multiplicador_ sin marcar _A elegir_, y luego para _Fuerza_ y _Destreza_ debes marcar ambas, marcar _A elegir_ en ambas y poner _2_ en el Multiplicador en ambas.

       - Finalmente, deberás definir los valores _Mínimo_ y _Máximo_ para el _Crédito_ de esta ocupación.
    - La pestaña de _Habilidades_ te permite seleccionar las _Habilidades de ocupación_ arrastrando objetos del Tipo _Habilidad_ a las diferentes secciones. Una ocupación típica tiene 8 habilidades más la habilidad _Crédito_.
        - Las _Habilidades comunes_ incluyen las habilidades de ocupación predeterminadas que no se pueden cambiar.
        - La sección _Grupos de habilidades a elegir_ permite agregar grupos (puedes crear varios) de habilidades para que el jugador elija. Una vez que haces clic en el signo `+`, se crea un grupo y puedes definir el _Número a elegir_ (número de habilidades a seleccionar) y crear un conjunto de habilidades disponibles para la selección arrastrándolas al grupo.
        - Finalmente, las _Habilidades adicionales_ te permiten ingresar un número de habilidades que el jugador puede elegir del resto de las habilidades disponibles.

# Creación de _Personaje Jugador_

Puedes crear un _Personaje Jugador_ creando el _actor_ y rellenando la correspondiente _Hoja de Personaje_ en blanco, pero es mucho más fácil si has creado previamente una _configuración_ y una _ocupación_ (ver arriba). Si has creado ambas, el proceso para crear el _Personaje Jugador_ es el siguiente:

1. Ve a la pestaña de [fas fa-users]Actores.
2. Haz clic en [fas fa-user]Crear actor.

   - Dale un nombre al actor.
   - Establece _Tipo_ como _Personaje_.

3. Arrastra y suelta un objeto de Tipo _Configuración_ (por ejemplo, 1920s, 1890s, Pulp, Moderno,...) en la hoja para hacer la configuración básica utilizando la configuración definida en el objeto. Esto suele incluir lanzar las características o establecer sus valores con el sistema de puntos, y establecer un conjunto predeterminado de habilidades correspondientes a la configuración dada.

4. Arrastra y suelta un objeto de Tipo _Ocupación_ en la hoja, esto probablemente implicará seleccionar algunas habilidades de un conjunto reducido o de las restantes. Esto calculará los _Puntos de habilidades de interés personal_ y _Puntos de ocupación_ disponibles y asignará la parte de los Puntos de ocupación para alcanzar el valor mínimo de _Crédito_ de la ocupación seleccionada.

5. En el menú del Guardián a la izquierda, haz clic en [game-icon game-icon-tentacle-strike]Herramientas del Guardián; si este menú no está disponible, necesitas tener una escena activa, la cual puede ser creada en la pestaña de [fas fa-map]Escenas.

6. En el nuevo submenú, haz clic en [fas fa-user-edit]Modo de creación de personajes. Debería aparecer una nueva pestaña llamada _Desarrollo_ en las hojas de personaje.

7. Haz clic en la pestaña de _Desarrollo_ de los personajes.

8. La primera columna de puntos es para tus habilidades de ocupación; estas se pueden alternar haciendo clic en ellas.
   - Si has habilitado la regla de Arquetipos Pulp, tendrás un segundo punto para alternar eso.

9. Distribuye los puntos de ocupación y de intereses personales en la pestaña de Desarrollo teniendo en cuenta que cada habilidad tiene 5 columnas:
    1. La primera es el porcentaje básico de la habilidad.
    2. La segunda es donde se ponen los _Puntos de interés personal_ durante la creación del personaje.
    3. La tercera solo está disponible para las habilidades de _ocupación_ (marcadas con un círculo oscuro antes del nombre de la habilidad) y se usa para asignar los _Puntos de ocupación_.
        - Si has habilitado la regla de Arquetipos Pulp, tendrás una cuarta columna donde ingresas tus puntos de arquetipo.
    4. La cuarta/quinta columna debería estar inicialmente en blanco y es donde aparecerán los puntos de experiencia (también puedes asignar puntos aquí si estás jugando con un personaje experimentado).
    5. La columna final es de solo lectura y muestra el valor final calculado para la habilidad (la suma de las otras 4).

- [Video que muestra el proceso de creación de personajes](https://www.youtube.com/watch?v=VsQZHVXFwlk)
