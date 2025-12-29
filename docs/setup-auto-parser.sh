# Настройка автоматического парсинга отзывов на Linux

## 1. Создаём systemd timer для периодического запуска

### Создаём службу (service)
sudo tee /etc/systemd/system/yandex-reviews-parser.service > /dev/null << 'EOF'
[Unit]
Description=Yandex Reviews Auto Parser
After=network.target xvfb.service

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/var/www/ZumZam
Environment="DISPLAY=:99"
Environment="NODE_ENV=production"
EnvironmentFile=/var/www/ZumZam/.env.production
ExecStart=/usr/bin/node --loader ts-node/esm /var/www/ZumZam/scripts/auto-parse-reviews.ts
StandardOutput=journal
StandardError=journal
EOF

### Создаём таймер (запуск каждые 6 часов)
sudo tee /etc/systemd/system/yandex-reviews-parser.timer > /dev/null << 'EOF'
[Unit]
Description=Yandex Reviews Parser Timer
Requires=yandex-reviews-parser.service

[Timer]
# Запуск каждые 6 часов
OnCalendar=*-*-* 00,06,12,18:00:00
# Запуск через 5 минут после старта системы (если пропустили)
OnBootSec=5min
# Если пропустили запуск - запустить при следующей возможности
Persistent=true

[Install]
WantedBy=timers.target
EOF

## 2. Активируем таймер
sudo systemctl daemon-reload
sudo systemctl enable yandex-reviews-parser.timer
sudo systemctl start yandex-reviews-parser.timer

## 3. Проверяем статус
sudo systemctl status yandex-reviews-parser.timer

# Список всех таймеров
sudo systemctl list-timers

## 4. Просмотр логов
sudo journalctl -u yandex-reviews-parser.service -f

## 5. Ручной запуск (для теста)
sudo systemctl start yandex-reviews-parser.service

## 6. Изменение частоты запуска

### Каждые 3 часа:
# OnCalendar=*-*-* 00,03,06,09,12,15,18,21:00:00

### Каждый час:
# OnCalendar=hourly

### Каждый день в 3:00:
# OnCalendar=daily
# OnCalendar=*-*-* 03:00:00

### Каждую неделю в понедельник в 2:00:
# OnCalendar=Mon *-*-* 02:00:00

## После изменений:
sudo systemctl daemon-reload
sudo systemctl restart yandex-reviews-parser.timer


