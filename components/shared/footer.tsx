import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-8 pb-6 sm:pt-12 sm:pb-10 mt-10 sm:mt-16">
      <div className="mx-auto max-w-[1340px] px-2 sm:px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* О нас */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] sm:text-[15px]">О ZumZam</h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/about" className="hover:text-orange-400 transition-colors">
                  О сервисе
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-orange-400 transition-colors">
                  Помощь
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-orange-400 transition-colors">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Клиентам */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] sm:text-[15px]">Клиентам</h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/#board" className="hover:text-orange-400 transition-colors">
                  Доска объявлений
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-orange-400 transition-colors">
                  Услуги
                </Link>
              </li>
              <li>
                <Link href="/scenario-generator" className="hover:text-orange-400 transition-colors">
                  Генератор сценариев
                </Link>
              </li>
            </ul>
          </div>

          {/* Партнерам */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] sm:text-[15px]">Партнерам</h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/signup" className="hover:text-orange-400 transition-colors">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link href="/advertising" className="hover:text-orange-400 transition-colors">
                  Реклама
                </Link>
              </li>
            </ul>
          </div>

          {/* Документы */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] sm:text-[15px]">Документы</h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link href="/terms" className="hover:text-orange-400 transition-colors">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-400 transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[13px] text-gray-400 text-center sm:text-left">
              © {new Date().getFullYear()} ZumZam. Все права защищены.
            </p>
            <div className="flex gap-4 text-[13px]">
              <a href="https://vk.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                ВКонтакте
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                Telegram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}





