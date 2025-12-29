-- Экспорт данных из локальной БД
-- Только данные, без структуры

-- Экспорт пользователей
COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER;

-- Экспорт профилей
COPY (SELECT * FROM public.profiles) TO STDOUT WITH CSV HEADER;

-- Экспорт активностей профилей
COPY (SELECT * FROM public.profile_activities) TO STDOUT WITH CSV HEADER;

-- Экспорт услуг профилей
COPY (SELECT * FROM public.profile_services) TO STDOUT WITH CSV HEADER;

-- Экспорт локаций
COPY (SELECT * FROM public.profile_locations) TO STDOUT WITH CSV HEADER;

-- Экспорт отзывов
COPY (SELECT * FROM public.reviews) TO STDOUT WITH CSV HEADER;

-- Экспорт мастер-классов
COPY (SELECT * FROM public.master_class_programs) TO STDOUT WITH CSV HEADER;

-- Экспорт шоу-программ
COPY (SELECT * FROM public.show_programs) TO STDOUT WITH CSV HEADER;

-- Экспорт квестов
COPY (SELECT * FROM public.quest_programs) TO STDOUT WITH CSV HEADER;

-- Экспорт персонажей аниматоров
COPY (SELECT * FROM public.animator_characters) TO STDOUT WITH CSV HEADER;

-- Экспорт партнёров агентств
COPY (SELECT * FROM public.agency_partners) TO STDOUT WITH CSV HEADER;

-- Экспорт кейсов агентств
COPY (SELECT * FROM public.agency_cases) TO STDOUT WITH CSV HEADER;

-- Экспорт активности пользователей
COPY (SELECT * FROM public.user_activity) TO STDOUT WITH CSV HEADER;

-- Только данные, без структуры

-- Экспорт пользователей
COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER;

-- Экспорт профилей
COPY (SELECT * FROM public.profiles) TO STDOUT WITH CSV HEADER;

-- Экспорт активностей профилей
COPY (SELECT * FROM public.profile_activities) TO STDOUT WITH CSV HEADER;

-- Экспорт услуг профилей
COPY (SELECT * FROM public.profile_services) TO STDOUT WITH CSV HEADER;

-- Экспорт локаций
COPY (SELECT * FROM public.profile_locations) TO STDOUT WITH CSV HEADER;

-- Экспорт отзывов
COPY (SELECT * FROM public.reviews) TO STDOUT WITH CSV HEADER;

-- Экспорт мастер-классов
COPY (SELECT * FROM public.master_class_programs) TO STDOUT WITH CSV HEADER;

-- Экспорт шоу-программ
COPY (SELECT * FROM public.show_programs) TO STDOUT WITH CSV HEADER;

-- Экспорт квестов
COPY (SELECT * FROM public.quest_programs) TO STDOUT WITH CSV HEADER;

-- Экспорт персонажей аниматоров
COPY (SELECT * FROM public.animator_characters) TO STDOUT WITH CSV HEADER;

-- Экспорт партнёров агентств
COPY (SELECT * FROM public.agency_partners) TO STDOUT WITH CSV HEADER;

-- Экспорт кейсов агентств
COPY (SELECT * FROM public.agency_cases) TO STDOUT WITH CSV HEADER;

-- Экспорт активности пользователей
COPY (SELECT * FROM public.user_activity) TO STDOUT WITH CSV HEADER;




