# Установка зависимостей для Puppeteer на Linux с виртуальным дисплеем

## 1. Установка Xvfb (Virtual Framebuffer)
sudo apt-get update
sudo apt-get install -y xvfb

## 2. Установка зависимостей для Chrome
sudo apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2

## 3. Запуск виртуального дисплея
# Опция 1: Запуск вручную
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99

# Опция 2: Systemd сервис (автозапуск при старте системы)
sudo tee /etc/systemd/system/xvfb.service > /dev/null << EOF
[Unit]
Description=X Virtual Frame Buffer Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/Xvfb :99 -screen 0 1920x1080x24
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable xvfb
sudo systemctl start xvfb

## 4. Настройка переменной окружения для всех процессов
echo "export DISPLAY=:99" | sudo tee -a /etc/environment

## 5. Проверка
export DISPLAY=:99
node test-parse-real.js

# Если всё работает - Puppeteer будет использовать виртуальный дисплей!


