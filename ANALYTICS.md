# Аналитика Linny — события и настройка Amplitude

## 1. Все собираемые события

Сервис аналитики: **Amplitude** (`@amplitude/analytics-browser ^2.40.0`)  
Инициализация: при старте приложения, userId = Telegram user ID пользователя  
Файл реализации: `src/utils/analytics.ts`

---

### 1.1 Запуск приложения

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `app_open` | — | При каждом открытии Mini App |

---

### 1.2 Гараж

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `garage_viewed` | `car_count: number` | При загрузке списка автомобилей |

---

### 1.3 Автомобиль

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `car_viewed` | `car_id: string` | При открытии карточки автомобиля |
| `car_created` | `make: string`, `engine_type: string` | После успешного создания авто |
| `car_edited` | `car_id: string` | После сохранения изменений авто |
| `car_deleted` | `car_id: string` | После удаления автомобиля |
| `tab_switched` | `car_id: string`, `tab: 'history' \| 'plan'` | При переключении вкладки История/Планы |
| `mileage_updated` | `car_id: string` | После обновления пробега |

---

### 1.4 Записи об обслуживании

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `record_created` | `car_id: string`, `title: string`, `linked_plan: boolean` | После создания записи; `linked_plan=true` если запись создана из плана |
| `record_edited` | `car_id: string` | После редактирования записи |
| `record_deleted` | `car_id: string` | После удаления записи |

---

### 1.5 Планы обслуживания

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `plan_created` | `car_id: string`, `title: string` | После создания плана |
| `plan_edited` | `car_id: string` | После редактирования плана |
| `plan_deleted` | `car_id: string` | После удаления плана |
| `plan_executed` | `car_id: string`, `plan_title: string` | При выполнении плана (создании записи из плана) |

---

### 1.6 AI-функции

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `suggestions_requested` | `car_id: string` | При нажатии «Заполнить по рекомендациям» |
| `description_viewed` | `car_id: string`, `has_description: boolean` | При открытии страницы описания/регламента |
| `description_generated` | `car_id: string` | При запуске авто-генерации описания |
| `description_saved` | `car_id: string` | После сохранения описания |

---

### 1.7 Шеринг

| Событие | Свойства | Когда срабатывает |
|---------|----------|-------------------|
| `share_page_opened` | `car_id: string` | При открытии страницы шеринга |
| `share_link_generated` | `car_id: string` | При генерации ссылки-шеринга |
| `share_sent` | `car_id: string` | При отправке ссылки через Telegram |

---

## 2. Воронки и графики в Amplitude

### 2.1 Воронки (Funnels)

---

#### Воронка 1 — Онбординг: от открытия до первого авто

**Цель:** измерить конверсию новых пользователей в активных.

**Шаги:**
1. `app_open`
2. `garage_viewed` where `car_count = 0`
3. `car_created`

**Как настроить в Amplitude:**
1. Открыть **Charts → + New Chart → Funnel Analysis**
2. Добавить шаги в указанном порядке
3. На шаге 2 добавить фильтр: `car_count = 0`
4. Conversion window: **7 дней**
5. Группировка: по дате первого `app_open` (Cohort — New Users)

**Ключевые метрики:** конверсия step 1→3, медиана времени до создания авто.

---

#### Воронка 2 — Активация AI: от просмотра авто до сохранения описания

**Цель:** понять, сколько пользователей доходят до сохранения AI-описания.

**Шаги:**
1. `car_viewed`
2. `description_viewed`
3. `description_generated`
4. `description_saved`

**Как настроить:**
1. **Funnel Analysis**, шаги выше
2. Conversion window: **3 дня**
3. Дополнительно смотреть Drop-off на шаге 2→3 (`description_generated`) — это узкое место

---

#### Воронка 3 — Выполнение плана обслуживания

**Цель:** оценить, насколько планы реально используются (создаются и исполняются).

**Шаги:**
1. `plan_created`
2. `plan_executed`

**Как настроить:**
1. **Funnel Analysis**
2. Conversion window: **30 дней** (пользователь мог создать план заранее)
3. Группировать по `title` чтобы видеть популярные типы планов

---

#### Воронка 4 — Шеринг: от открытия страницы до отправки

**Цель:** измерить конверсию в реальный шеринг (вирусный коэффициент).

**Шаги:**
1. `share_page_opened`
2. `share_link_generated`
3. `share_sent`

**Как настроить:**
1. **Funnel Analysis**
2. Conversion window: **1 день**
3. Смотреть Drop-off на шаге 2→3 — пользователи, которые сгенерировали ссылку, но не отправили

---

### 2.2 Графики удержания (Retention)

---

#### Retention 1 — Недельное удержание

**Цель:** понять, возвращаются ли пользователи в приложение.

**Как настроить:**
1. **Charts → Retention Analysis**
2. Start event: `app_open`
3. Return event: `app_open`
4. Bucket size: **Week**
5. Смотреть N-day retention за 4–8 недель

---

#### Retention 2 — Удержание активных пользователей (с авто)

**Как настроить:**
1. **Retention Analysis**
2. Start event: `car_created`
3. Return event: `app_open` или `record_created`
4. Bucket size: **Week**

Это покажет, возвращаются ли пользователи после того как завели авто.

---

### 2.3 Ключевые метрики (Event Segmentation)

---

#### График 1 — DAU / WAU / MAU

1. **Charts → Event Segmentation**
2. Event: `app_open`
3. Metric: **Unique users**
4. Interval: Day / Week / Month

---

#### График 2 — Популярность марок автомобилей

1. **Event Segmentation**
2. Event: `car_created`
3. Group by: `make`
4. Metric: **Event totals**

---

#### График 3 — Использование AI-функций

1. **Event Segmentation**
2. Events: `suggestions_requested`, `description_generated`, `description_saved`
3. Metric: **Unique users**
4. Interval: Week
5. Покажет рост использования AI-фич во времени

---

#### График 4 — Распределение по engine_type

1. **Event Segmentation**
2. Event: `car_created`
3. Group by: `engine_type`
4. Смотреть доли: бензин / дизель / электро / гибрид

---

#### График 5 — Активность пользователей (записи и планы)

1. **Event Segmentation**
2. Events: `record_created`, `plan_created`, `plan_executed`
3. Metric: **Unique users** и **Event totals**
4. Interval: Week

---

### 2.4 User Paths (пути пользователей)

**Цель:** понять, что делают пользователи после открытия приложения.

**Как настроить:**
1. **Charts → User Paths**
2. Start event: `app_open`
3. Max steps: 5–7
4. Exclude: `app_open` из промежуточных шагов

Покажет наиболее частые сценарии использования.

---

### 2.5 Дашборд (рекомендуемая структура)

| Раздел | Графики |
|--------|---------|
| **Рост** | DAU/WAU/MAU (app_open), новые пользователи (первый car_created) |
| **Активация** | Воронка онбординга, конверсия garage → car_created |
| **Вовлечённость** | record_created, plan_created, plan_executed за неделю |
| **AI-функции** | suggestions_requested, description_generated, description_saved |
| **Шеринг** | Воронка шеринга, share_sent/unique users |
| **Удержание** | N-day retention после первого car_created |

**Как создать дашборд:**
1. Построить каждый из графиков выше
2. На каждом графике нажать **Save to Dashboard**
3. Создать новый дашборд «Linny — Основные метрики»
4. Расположить по разделам через drag & drop
