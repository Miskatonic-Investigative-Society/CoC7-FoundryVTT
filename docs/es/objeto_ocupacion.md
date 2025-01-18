<!--- This file is auto generated from module/manual/es/objeto_ocupacion.md -->
# Tipo de objeto: Ocupación

Una _ocupación_ ayuda a definir el trasfondo del personaje, piensa en ello como la definición del conjunto de _habilidades ocupacionales_ (aquellas en las que el personaje puede gastar sus puntos de ocupación), además de la definición de cómo calcular la cantidad de puntos de ocupación disponibles. Finalmente, la _ocupación_ también permite definir el _crédito_ mínimo y máximo para un personaje con esta _ocupación_.

Ten en cuenta que el conjunto de _habilidades ocupacionales_ no necesita ser fijo; el sistema permite configurar la _ocupación_ para que, al arrastrarla a una hoja de personaje, ofrezca la opción de seleccionar una o más habilidades de una lista cerrada, o incluso agregar un número predefinido de habilidades para elegir entre todas las disponibles.

1. Ve al directorio de objetos.
2. Haz clic en Crear objeto.

   1. Dale un nombre a la configuración, por ejemplo, _Bibliotecario_.
   2. Establece el _Tipo_ como _Ocupación_.

3. En la pestaña _Descripción_, puedes cambiar el nombre, el icono, el nombre del libro fuente y la descripción.
4. En la pestaña _Detalles_ puedes controlar:

   1. Seleccionar el _Tipo de Ocupación_.
   2. Definir las características utilizadas para calcular los _puntos de ocupación_. Puedes marcar las características que desees y definir el multiplicador; para aquellas marcadas como _Opcional_, el jugador tendrá que elegir una en el momento de la creación.

      1. Por ejemplo, si una ocupación utiliza _EDU * 2 + (FUE o DES) * 2_, debes seleccionar _Educación_ y poner _2_ en el _Multiplicador_ sin marcar _Opcional_, y luego para _Fuerza_ y _Destreza_, debes marcar _Opcional_ en ambas, y poner _2_ en el Multiplicador en ambas.
      2. Finalmente, tendrás que definir el valor mínimo y máximo para la habilidad _Crédito_ para esta ocupación.

   3. Nombres de las secciones de la biografía (haz clic en el `+` para agregar secciones adicionales de biografía), esto se puede reemplazar con una biografía de bloque único en la configuración.
   4. En Objetos, puedes arrastrar y soltar objetos y armas predeterminados.

5. En la pestaña _Habilidades_, puedes arrastrar y soltar habilidades en varias secciones. Una ocupación típica tiene 8 habilidades más la habilidad _Crédito_.

   1. Las _Habilidades comunes_ incluyen las habilidades ocupacionales predeterminadas que no se pueden cambiar.
   2. La sección de _Grupos de habilidades a elegir_ permite agregar grupos (puedes crear varios) de habilidades para que el jugador elija. Una vez que hagas clic en el signo `+`, se crea un grupo y puedes definir la _Cantidad a elegir_ (número de habilidades para seleccionar) y crear un conjunto de habilidades disponibles para la selección arrastrándolas al grupo.
   3. Finalmente, las _Habilidades adicionales_ te permiten ingresar un número de habilidades que el jugador puede elegir entre el resto de las habilidades disponibles.
