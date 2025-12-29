-- Удаляем старый constraint если существует
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Создаём новый constraint с дополнительным статусом 'rejected'
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'));

-- Комментарий для документации
COMMENT ON CONSTRAINT orders_status_check ON orders IS 
  'Allowed order statuses: pending (новая), confirmed (подтверждено), in_progress (в работе), completed (завершено), cancelled (отменено клиентом), rejected (отклонено исполнителем)';

