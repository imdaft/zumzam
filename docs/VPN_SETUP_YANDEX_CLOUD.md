# Настройка WireGuard VPN на Yandex Cloud для Gemini API

## Вариант A: Все серверы через VPN (простой)

### 1. Установка WireGuard на Yandex Cloud

```bash
# Подключитесь к серверу Yandex Cloud по SSH
ssh user@your-yandex-cloud-server

# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем WireGuard
sudo apt install wireguard wireguard-tools -y
```

### 2. Получение конфига от вашего VPN сервера

У вас уже есть VPN сервер в Нидерландах. Вам нужно:

**На VPN сервере (Нидерланды):**

1. Создайте нового клиента (peer) для Yandex Cloud сервера:

```bash
# На VPN сервере выполните (если используете wg-quick или аналогичный скрипт)
./add-client.sh yandex-cloud-server

# Или вручную добавьте в /etc/wireguard/wg0.conf:
[Peer]
PublicKey = <публичный_ключ_клиента>
AllowedIPs = 10.0.0.X/32  # Новый IP для Yandex Cloud сервера
```

2. Сгенерируйте ключи для клиента (на VPN сервере):

```bash
# Генерация приватного ключа
wg genkey | tee yandex-cloud-private.key | wg pubkey > yandex-cloud-public.key

# Приватный ключ (нужен на Yandex Cloud сервере)
cat yandex-cloud-private.key

# Публичный ключ (нужен на VPN сервере в конфиге)
cat yandex-cloud-public.key
```

### 3. Настройка WireGuard на Yandex Cloud сервере

**На Yandex Cloud сервере:**

Создайте конфиг:

```bash
sudo nano /etc/wireguard/wg0.conf
```

Вставьте:

```ini
[Interface]
PrivateKey = <ваш_приватный_ключ_от_VPN_сервера>
Address = 10.0.0.X/24  # IP адрес из вашей VPN сети
DNS = 8.8.8.8

[Peer]
PublicKey = <публичный_ключ_VPN_сервера>
Endpoint = <IP_или_домен_вашего_VPN_сервера>:51820
AllowedIPs = 0.0.0.0/0  # Все запросы через VPN (для начала)
# Позже изменим на: 0.0.0.0/1, 128.0.0.0/1  # Только Google API через VPN
PersistentKeepalive = 25
```

### 4. Запуск WireGuard

```bash
# Запустить VPN
sudo wg-quick up wg0

# Проверить статус
sudo wg show

# Включить автозапуск при перезагрузке
sudo systemctl enable wg-quick@wg0
```

### 5. Проверка

```bash
# Проверить, что VPN работает
curl ifconfig.me
# Должен показать IP из Нидерландов

# Проверить доступ к Google API
curl https://generativelanguage.googleapis.com
# Не должно быть ошибки 403
```

---

## Вариант B: Только Google API через VPN (оптимальный)

Это более правильный вариант - только AI запросы через VPN, остальное напрямую.

### Изменение конфига WireGuard

Измените `/etc/wireguard/wg0.conf`:

```ini
[Interface]
PrivateKey = <ваш_приватный_ключ>
Address = 10.0.0.X/24
DNS = 8.8.8.8

[Peer]
PublicKey = <публичный_ключ_VPN_сервера>
Endpoint = <IP_VPN>:51820
# Только Google API домены через VPN
AllowedIPs = 142.250.0.0/15, 172.217.0.0/16, 216.58.0.0/16
PersistentKeepalive = 25
```

**Или более точно - только конкретный домен:**

```ini
AllowedIPs = 142.250.185.14/32  # generativelanguage.googleapis.com
```

**Как узнать IP домена:**
```bash
nslookup generativelanguage.googleapis.com
```

### Применить изменения

```bash
# Перезапустить WireGuard
sudo wg-quick down wg0
sudo wg-quick up wg0
```

---

## Вариант C: SOCKS5 прокси через VPN (для Node.js приложения)

Если не хотите менять сетевые настройки всего сервера, можно настроить прокси только для Node.js.

### 1. Настройте SOCKS5 на VPN сервере

**На VPN сервере (Нидерланды):**

```bash
# Установить Dante SOCKS5 прокси
sudo apt install dante-server -y

# Настроить /etc/danted.conf
# (позвольте подключения с вашего Yandex Cloud IP)
```

### 2. Использовать в Node.js через прокси

В вашем коде можно использовать библиотеку `https-proxy-agent`:

```bash
npm install https-proxy-agent
```

И модифицировать запросы к Google API через прокси.

**НО**: SDK `@google/generative-ai` не поддерживает прокси напрямую. Нужно будет использовать REST API напрямую или настроить системный прокси для Node.js процесса.

---

## Вариант D: Системный прокси только для Node.js процесса (лучший для Next.js)

### 1. Настройте SOCKS5 прокси на VPN сервере

**На VPN сервере:**

```bash
sudo apt install dante-server -y

sudo nano /etc/danted.conf
```

Конфиг:

```ini
logoutput: /var/log/danted.log
internal: eth0 port = 1080
external: wg0

clientmethod: none
socksmethod: none

user.privileged: root
user.unprivileged: nobody

client pass {
    from: 0.0.0.0/0 to: 0.0.0.0/0
    log: error connect disconnect
}

socks pass {
    from: 0.0.0.0/0 to: 0.0.0.0/0
    log: error connect disconnect
}
```

```bash
sudo systemctl start danted
sudo systemctl enable danted
```

### 2. Использовать в Next.js через переменные окружения

**На Yandex Cloud сервере:**

В `.env` или переменных окружения:

```bash
# SOCKS5 прокси для Google API
SOCKS_PROXY=socks5://user:pass@your-vpn-server:1080
```

**Модификация кода:**

Использовать библиотеку `socks-proxy-agent` или настроить через системные переменные:

```bash
export HTTP_PROXY=socks5://your-vpn-server:1080
export HTTPS_PROXY=socks5://your-vpn-server:1080
```

И запускать Node.js с этими переменными.

**ПРОБЛЕМА**: SDK Google не поддерживает SOCKS напрямую. Нужно будет обернуть через HTTP прокси или использовать другой подход.

---

## Рекомендация

**Для вашего случая лучше всего:**

### Вариант B + Обновление кода

1. Настроить WireGuard с `AllowedIPs` только для Google API IP
2. Оставить код как есть - запросы автоматически пойдут через VPN

**Плюсы:**
- ✅ Все автоматически работает
- ✅ Не нужно менять код
- ✅ Только AI трафик через VPN
- ✅ Быстро для российских ресурсов

**Минусы:**
- ⚠️ Нужно знать точные IP Google API (они могут меняться)

---

## Тестирование после настройки

Создайте тестовый скрипт:

```bash
# test-gemini-vpn.sh
#!/bin/bash

echo "1. Проверка IP адреса:"
curl -s ifconfig.me
echo ""

echo "2. Проверка доступа к Google API:"
curl -s -o /dev/null -w "%{http_code}" https://generativelanguage.googleapis.com/v1/models
echo ""

echo "3. Тест через Node.js:"
node -e "
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
model.generateContent('test').then(r => console.log('✅ Работает!')).catch(e => console.log('❌ Ошибка:', e.message));
"
```

Запустите:
```bash
chmod +x test-gemini-vpn.sh
GEMINI_API_KEY=your_key ./test-gemini-vpn.sh
```

---

## Troubleshooting

### VPN не подключается

```bash
# Проверить логи
sudo journalctl -u wg-quick@wg0 -f

# Проверить firewall на VPN сервере
# Должен быть открыт порт 51820/udp
```

### Запросы все еще идут напрямую

```bash
# Проверить маршрутизацию
ip route show

# Должен быть маршрут через wg0 для Google API
```

### Медленно работает

```bash
# Проверить задержку до VPN сервера
ping <ip-vpn-сервера>

# Если > 100ms, возможно нужно выбрать другой VPN сервер
```

---

## Безопасность

1. ✅ Firewall на VPN сервере - разрешить только нужные порты
2. ✅ Используйте только ключи (не пароли)
3. ✅ Регулярно обновляйте WireGuard
4. ✅ Мониторьте логи на подозрительную активность
















