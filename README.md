# Data Model Canvas

Интерактивный инструмент для визуального проектирования, анализа и документирования моделей данных. Создавайте ER-диаграммы из файлов, редактируйте их на холсте и экспортируйте в SQL, S2T или AI-промпты.

**Живое демо:** [kitaevalexey.github.io/data-model-canvas](https://kitaevalexey.github.io/data-model-canvas)

## Для кого

- **Аналитики DWH / BI** — аудит и проектирование моделей данных
- **Архитекторы данных** — быстрая валидация схем перед разработкой
- **Консультанты** — проведение воркшопов с живым прототипированием

## Возможности

### Импорт моделей
- **S2T** — текстовый формат описания схемы БД
- **Excel** (.xlsx) — один лист на таблицу или все таблицы на одном листе
- **CSV** — все таблицы в одном файле

### Редактирование
- Перетаскивание таблиц по холсту
- Масштабирование и панорамирование
- Добавление, удаление, редактирование таблиц и колонок
- Настройка первичных и внешних ключей

### Анализ и генерация
- **Анализатор коллизий** — проверка на 5 типов ошибок
- **Генератор тестовых данных** — INSERT-скрипты с умной генерацией значений
- **SQL Helper** — шаблоны запросов на основе модели

### Экспорт
- **DDL** — CREATE TABLE скрипты
- **S2T** — текстовое описание модели
- **AI Prompt** — структурированный промпт для генерации ETL/DML
- **Excel** — единый файл со всеми таблицами

### Сохранение
- Автосохранение в localStorage браузера
- Восстановление при следующем открытии

## Форматы файлов

### S2T (.s2t / .txt)

Table: Customers
  ID: int PK
  Name: varchar(100)
  Segment: varchar(50)

Table: Orders
  ID: int PK
  CustomerID: int FK -> Customers.ID
  OrderDate: date
  Amount: decimal(10,2)

**Правила:**
- Table: Имя — начало новой таблицы
- Отступ + Колонка: Тип — колонка
- PK — первичный ключ
- FK -> Таблица.Колонка — внешний ключ

### Excel (.xlsx)

**Формат 1: Все таблицы на одном листе**

| Table | Column Name | Data Type | Key | References |
|-------|-------------|-----------|-----|------------|
| Customers | ID | int | PK | |
| Orders | CustomerID | int | FK | Customers.ID |

**Формат 2: Один лист = одна таблица**

Лист Customers:

| Column Name | Data Type | Key | References |
|-------------|-----------|-----|------------|
| ID | int | PK | |
| Name | varchar(100) | | |

### CSV (.csv)

Table,Column Name,Data Type,Key,References
Customers,ID,int,PK,
Customers,Name,varchar(100),,
Orders,ID,int,PK,
Orders,CustomerID,int,FK,Customers.ID

## Быстрый старт

1. Откройте [демо](https://kitaevalexey.github.io/data-model-canvas)
2. Нажмите **Load Sample Model** для просмотра демо-модели
3. Или **Import** → выберите ваш файл
4. Редактируйте модель на холсте
5. Экспортируйте результат

## Примеры файлов

Готовые файлы для тестирования находятся в папке examples/:
- sample.s2t — текстовый формат
- sample.csv — CSV формат
- sample.xlsx — Excel формат

## Разработка

npm install
npm run dev

## Деплой

npm run deploy

## Технологии

- React 19 + TypeScript
- Vite
- Tailwind CSS
- SheetJS (xlsx)
- PapaParse (csv)
- GitHub Pages

## Лицензия

MIT