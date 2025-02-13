<!--- This file is auto generated from module/manual/uk/effects.md -->
# Ефекти

Система надає можливість створення активних ефектів.
Вони можуть змінювати характеристики, атрибути та уміння персонажа.
Ефект може бути створений як [посилання](links.md) за допомогою [Інструменту створення посилань](link_creation_window.md) чи прямо у листі персонажа, за допомогою спеціальної кнопки.

## Вкладка Ефектів

Ефекти будуть знаходитися у вкладці ефектів персонажа.

![](../../assets/manual/effects/effects-tab.webp)

У Ігрових персонажів ефекти розбиті у 4 категорії:

- Стан: ці ефекти використовуються та створюються системою (глибока рана, повалений, непритомний, божевільний тощо). Вони не роблять жодних змін.
- Тимчасові: ці ефекти мають тривалість.
- Пасивні: ці ефекти працюють завжди.
- Неактивні: це вимкнені ефекти.

Для НІПів/Монстрів є тільки 2 категорії: активні та неактивні.
Зміни за допомогою ефекту вносяться тільки коли він активен.

## Створення ефектів

Ви можете створити ефект натиснувши кнопку "+ Додати".
Після чого він з'явиться у списку й ви зможете його відредагувати за вашим бажанням.
Вікно Ефекту має 3 вкладки:

### Деталі (Details)

![Details tab](../../assets/manual/effects/details-tab.webp)

### Тривалість (Duration)

![Duration tab](../../assets/manual/effects/duration-tab.webp)

### Зміни (Effects)

![Changes tab](../../assets/manual/effects/changes-tab.webp)

Остання вкладка й містить усі зміни які будуть застосовані до персонажа.

## Зміни

Зміна проводиться через системну змінну.  Кожна змінна має свій системний шлях.
Доступні змінні:

- Характеристики:
  - Сила:
    - Значення - _system.characteristics.str.value_
    - Бонусні кістки - _system.characteristics.str.bonusDice_
  - Статура:
    - Значення - _system.characteristics.con.value_
    - Бонусні кістки - _system.characteristics.con.bonusDice_
  - Розмір:
    - Значення - _system.characteristics.siz.value_
    - Бонусні кістки - _system.characteristics.siz.bonusDice_
  - Спритність:
    - Значення -  _system.characteristics.dex.value_
    - Бонусні кістки - _system.characteristics.dex.bonusDice_
  - Привабливість:
    - Значення - _system.characteristics.app.value_
    - Бонусні кістки - _system.characteristics.app.bonusDice_
  - Інтелект:
    - Значення - _system.characteristics.int.value_
    - Бонусні кістки - _system.characteristics.int.bonusDice_
  - Воля:
    - Значення - _system.characteristics.pow.value_
    - Бонусні кістки - _system.characteristics.pow.bonusDice_
  - Освіта:
    - Значення - _system.characteristics.edu.value_
    - Бонусні кістки - _system.characteristics.edu.bonusDice_
- Атрибути:
  - Талан:
    - Значення - _system.attribs.lck.value_
    - Бонусні кістки - _system.attribs.lck.bonusDice_
  - Глузд:
    - Значення - _system.attribs.san.value_
    - Бонусні кістки - _system.attribs.san.bonusDice
  - Переміщення:
    - Значення - _system.attribs.mov.value_
  - Будова:
    - Значення - _system.attribs.build.value_
  - Бонусні пошкодження:
    - Значення - _system.attribs.db.value_
  - Броня:
    - Значення - _system.attribs.armor.value_
- Похідні атрибути. В них можна змінити тільки максимальне значення. Ці зміни застосовуються після того, як були внесені всі інші. Якщо атрибут знаходиться в автоматичному режимі, він буде перерахований з до того як до нього застосується зміна.
  - Очки здоров'я:
    - Макс. значення - _system.attribs.hp.max_
  - Глузд:
    - Макс. значення - _system.attribs.san.max_
- Уміння. Вони визначаються за їх повним ім'ям й є чутливими до регістру!
  - Шарм
    - Значення - _system.skills.Шарм.value_
    - Бонусні кістки - _system.skills.Шарм.bonusDice_
  - Fighting (Brawl)
    - Значення - _system.skills.Fighting (Brawl).value_
    - Бонусні кістки - _system.skills.Fighting (Brawl).bonusDice_
