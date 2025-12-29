import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth/jwt'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId') || searchParams.get('profile_id')
    const applyMigration = searchParams.get('applyMigration') === 'true'

    // Временный endpoint для применения миграции (только для разработки)
    if (applyMigration) {
      try {
        await prisma.$executeRawUnsafe(`
          -- Добавляем недостающие колонки
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'animator_characters' AND column_name = 'photos'
            ) THEN
              ALTER TABLE animator_characters 
                ADD COLUMN photos text[] DEFAULT '{}'::text[];
            END IF;
            
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'animator_characters' AND column_name = 'active'
            ) AND NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'animator_characters' AND column_name = 'is_active'
            ) THEN
              ALTER TABLE animator_characters 
                RENAME COLUMN active TO is_active;
              ALTER TABLE animator_characters 
                ALTER COLUMN is_active SET DEFAULT true;
            END IF;
          END $$;
          
          ALTER TABLE animator_characters 
            ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}'::text[];
          
          ALTER TABLE animator_characters 
            ADD COLUMN IF NOT EXISTS program_types text[] DEFAULT '{}'::text[];
          
          ALTER TABLE animator_characters 
            ADD COLUMN IF NOT EXISTS video_url text;
          
          ALTER TABLE animator_characters 
            ADD COLUMN IF NOT EXISTS age_range text;
          
          ALTER TABLE animator_characters 
            ADD COLUMN IF NOT EXISTS work_format text;
          
          CREATE INDEX IF NOT EXISTS idx_animator_characters_active ON animator_characters(is_active);
          CREATE INDEX IF NOT EXISTS idx_animator_characters_profile_id ON animator_characters(profile_id);
        `)
        return NextResponse.json({ success: true, message: 'Migration applied' })
      } catch (migrationError: any) {
        logger.error('[Animator Characters API] Migration error:', migrationError)
        return NextResponse.json({ error: migrationError.message }, { status: 500 })
      }
    }

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    // Проверяем наличие колонки photos и применяем миграцию если нужно
    const hasPhotos: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'animator_characters' AND column_name = 'photos'
    `)
    
    if (hasPhotos[0]?.count === '0') {
      logger.info('[Animator Characters API] Applying migration...')
      try {
        // Выполняем каждый ALTER TABLE отдельно для надёжности
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[]`)
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}'::text[]`)
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS program_types text[] DEFAULT '{}'::text[]`)
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS video_url text`)
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS age_range text`)
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS work_format text`)
        
        // Проверяем наличие active и переименовываем в is_active если нужно
        const hasActive: any = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_name = 'animator_characters' AND column_name = 'active'
        `)
        const hasIsActive: any = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_name = 'animator_characters' AND column_name = 'is_active'
        `)
        
        if (hasActive[0]?.count === '1' && hasIsActive[0]?.count === '0') {
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters RENAME COLUMN active TO is_active`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ALTER COLUMN is_active SET DEFAULT true`)
        } else if (hasIsActive[0]?.count === '0') {
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`)
        }
        
        // Создаём индексы
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_animator_characters_active ON animator_characters(is_active)`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_animator_characters_profile_id ON animator_characters(profile_id)`)
        
        logger.info('[Animator Characters API] Migration applied successfully')
      } catch (migrationError: any) {
        logger.error('[Animator Characters API] Migration error:', migrationError)
        // Продолжаем выполнение, даже если миграция не удалась
      }
    }

    // Используем SELECT * чтобы избежать ошибок с отсутствующими колонками
    // Пробуем сначала с is_active, если ошибка - используем active
    let characters: any
    try {
      characters = await prisma.$queryRawUnsafe(`
        SELECT * 
        FROM animator_characters
        WHERE profile_id = $1::uuid 
          AND (is_active = true OR is_active IS NULL)
        ORDER BY created_at ASC
      `, profileId)
    } catch (error: any) {
      // Если is_active не существует, используем active
      if (error.message?.includes('is_active')) {
        characters = await prisma.$queryRawUnsafe(`
          SELECT * 
          FROM animator_characters
          WHERE profile_id = $1::uuid 
            AND (active = true OR active IS NULL)
          ORDER BY created_at ASC
        `, profileId)
      } else {
        throw error
      }
    }

    return NextResponse.json({ characters })
  } catch (error: any) {
    logger.error('[Animator Characters API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.profile_id || !body.name) {
      return NextResponse.json({ error: 'profile_id and name are required' }, { status: 400 })
    }

    // Проверяем права доступа
    const profile = await prisma.profiles.findUnique({
      where: { id: body.profile_id },
      select: { user_id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const isAdmin = user?.role === 'admin'

    if (!isAdmin && profile.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Применяем миграцию если нужно - выполняем каждый ALTER TABLE отдельно
    const photosCheck: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'animator_characters' AND column_name = 'photos'
    `)
    
    logger.info('[Animator Characters API] Photos column check:', photosCheck[0]?.count)
    
    if (photosCheck[0]?.count === '0') {
      logger.info('[Animator Characters API] Applying migration in POST...')
      try {
        // Выполняем каждый ALTER TABLE отдельно для надёжности
        logger.info('[Animator Characters API] Step 1: Adding photos column...')
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[]`)
        logger.info('[Animator Characters API] Step 2: Adding age_ranges column...')
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}'::text[]`)
        logger.info('[Animator Characters API] Step 3: Adding program_types column...')
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS program_types text[] DEFAULT '{}'::text[]`)
        logger.info('[Animator Characters API] Step 4: Adding video_url column...')
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS video_url text`)
        logger.info('[Animator Characters API] Step 5: Adding age_range column...')
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS age_range text`)
        logger.info('[Animator Characters API] Step 6: Adding work_format column...')
        await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS work_format text`)
        
        // Проверяем наличие active и переименовываем в is_active если нужно
        logger.info('[Animator Characters API] Step 7: Checking active/is_active columns...')
        const hasActive: any = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_name = 'animator_characters' AND column_name = 'active'
        `)
        const hasIsActive: any = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_name = 'animator_characters' AND column_name = 'is_active'
        `)
        
        if (hasActive[0]?.count === '1' && hasIsActive[0]?.count === '0') {
          logger.info('[Animator Characters API] Step 8: Renaming active to is_active...')
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters RENAME COLUMN active TO is_active`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ALTER COLUMN is_active SET DEFAULT true`)
        } else if (hasIsActive[0]?.count === '0') {
          logger.info('[Animator Characters API] Step 8: Adding is_active column...')
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`)
        }
        
        // Создаём индексы
        logger.info('[Animator Characters API] Step 9: Creating indexes...')
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_animator_characters_active ON animator_characters(is_active)`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_animator_characters_profile_id ON animator_characters(profile_id)`)
        
        // Проверяем, что колонки действительно созданы
        logger.info('[Animator Characters API] Step 10: Verifying migration...')
        const verifyPhotos: any = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM information_schema.columns 
          WHERE table_name = 'animator_characters' AND column_name = 'photos'
        `)
        
        if (verifyPhotos[0]?.count === '0') {
          throw new Error('Migration failed: photos column was not created')
        }
        
        logger.info('[Animator Characters API] Migration applied successfully in POST, photos column verified')
      } catch (migrationError: any) {
        logger.error('[Animator Characters API] Migration error in POST:', migrationError)
        // Не продолжаем выполнение, если миграция не удалась
        return NextResponse.json({ 
          error: 'Database migration failed. Please contact support.',
          details: migrationError.message 
        }, { status: 500 })
      }
    }

    // Проверяем, какие колонки есть в таблице
    const columns: any = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'animator_characters'
    `)
    const columnNames = columns.map((c: any) => c.column_name)
    const hasPhotos = columnNames.includes('photos')
    const hasIsActive = columnNames.includes('is_active')
    const hasActive = columnNames.includes('active')
    const activeCol = hasIsActive ? 'is_active' : (hasActive ? 'active' : null)
    
    logger.info('[Animator Characters API] Table columns:', { hasPhotos, hasIsActive, hasActive, activeCol })

    // Используем INSERT с правильными типами, адаптируя под существующую структуру
    try {
      let character: any
      
      if (hasPhotos && activeCol) {
        // Новая структура с photos и is_active/active
        const [result]: any = await prisma.$queryRawUnsafe(`
          INSERT INTO animator_characters (
            profile_id, name, description, photos, video_url, age_ranges, 
            program_types, work_format, ${activeCol}, created_at, updated_at
          ) VALUES ($1::uuid, $2, $3, $4::text[], $5, $6::text[], $7::text[], $8, $9, NOW(), NOW())
          RETURNING *
        `, 
          body.profile_id,
          body.name,
          body.description || null,
          body.photos || [],
          body.video_url || null,
          body.age_ranges || [],
          body.program_types || [],
          body.work_format || null,
          body.is_active !== false
        )
        character = result
      } else if (hasPhotos) {
        // Структура с photos, но без active/is_active
        const [result]: any = await prisma.$queryRawUnsafe(`
          INSERT INTO animator_characters (
            profile_id, name, description, photos, video_url, age_ranges, 
            program_types, work_format, created_at, updated_at
          ) VALUES ($1::uuid, $2, $3, $4::text[], $5, $6::text[], $7::text[], $8, NOW(), NOW())
          RETURNING *
        `, 
          body.profile_id,
          body.name,
          body.description || null,
          body.photos || [],
          body.video_url || null,
          body.age_ranges || [],
          body.program_types || [],
          body.work_format || null
        )
        character = result
      } else if (activeCol) {
        // Старая структура без photos, но с active/is_active
        const [result]: any = await prisma.$queryRawUnsafe(`
          INSERT INTO animator_characters (
            profile_id, name, description, ${activeCol}, created_at, updated_at
          ) VALUES ($1::uuid, $2, $3, $4, NOW(), NOW())
          RETURNING *
        `, 
          body.profile_id,
          body.name,
          body.description || null,
          body.is_active !== false
        )
        character = result
      } else {
        // Минимальная структура
        const [result]: any = await prisma.$queryRawUnsafe(`
          INSERT INTO animator_characters (
            profile_id, name, description, created_at, updated_at
          ) VALUES ($1::uuid, $2, $3, NOW(), NOW())
          RETURNING *
        `, 
          body.profile_id,
          body.name,
          body.description || null
        )
        character = result
      }

      logger.info('[Animator Characters API] Created:', character.id)
      return NextResponse.json({ character }, { status: 201 })
    } catch (insertError: any) {
      // Если ошибка связана с отсутствующими колонками, пробуем применить миграцию ещё раз
      if (insertError.message?.includes('does not exist') || insertError.message?.includes('column')) {
        logger.warn('[Animator Characters API] Retrying migration after insert error...')
        try {
          // Выполняем каждый ALTER TABLE отдельно
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[]`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS age_ranges text[] DEFAULT '{}'::text[]`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS program_types text[] DEFAULT '{}'::text[]`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS video_url text`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS age_range text`)
          await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS work_format text`)
          
          // Проверяем is_active
          const hasIsActive: any = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as count
            FROM information_schema.columns 
            WHERE table_name = 'animator_characters' AND column_name = 'is_active'
          `)
          if (hasIsActive[0]?.count === '0') {
            const hasActive: any = await prisma.$queryRawUnsafe(`
              SELECT COUNT(*) as count
              FROM information_schema.columns 
              WHERE table_name = 'animator_characters' AND column_name = 'active'
            `)
            if (hasActive[0]?.count === '1') {
              await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters RENAME COLUMN active TO is_active`)
              await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ALTER COLUMN is_active SET DEFAULT true`)
            } else {
              await prisma.$executeRawUnsafe(`ALTER TABLE animator_characters ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`)
            }
          }
          
          // Проверяем структуру таблицы после миграции
          const retryColumns: any = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'animator_characters'
          `)
          const retryColumnNames = retryColumns.map((c: any) => c.column_name)
          const retryHasPhotos = retryColumnNames.includes('photos')
          const retryHasIsActive = retryColumnNames.includes('is_active')
          const retryHasActive = retryColumnNames.includes('active')
          const retryActiveCol = retryHasIsActive ? 'is_active' : (retryHasActive ? 'active' : null)
          
          // Повторяем INSERT с адаптивной структурой
          let retryCharacter: any
          if (retryHasPhotos && retryActiveCol) {
            const [result]: any = await prisma.$queryRawUnsafe(`
              INSERT INTO animator_characters (
                profile_id, name, description, photos, video_url, age_ranges, 
                program_types, work_format, ${retryActiveCol}, created_at, updated_at
              ) VALUES ($1::uuid, $2, $3, $4::text[], $5, $6::text[], $7::text[], $8, $9, NOW(), NOW())
              RETURNING *
            `, 
              body.profile_id,
              body.name,
              body.description || null,
              body.photos || [],
              body.video_url || null,
              body.age_ranges || [],
              body.program_types || [],
              body.work_format || null,
              body.is_active !== false
            )
            retryCharacter = result
          } else if (retryHasPhotos) {
            const [result]: any = await prisma.$queryRawUnsafe(`
              INSERT INTO animator_characters (
                profile_id, name, description, photos, video_url, age_ranges, 
                program_types, work_format, created_at, updated_at
              ) VALUES ($1::uuid, $2, $3, $4::text[], $5, $6::text[], $7::text[], $8, NOW(), NOW())
              RETURNING *
            `, 
              body.profile_id,
              body.name,
              body.description || null,
              body.photos || [],
              body.video_url || null,
              body.age_ranges || [],
              body.program_types || [],
              body.work_format || null
            )
            retryCharacter = result
          } else {
            throw new Error('Migration retry failed: required columns still missing')
          }
          
          const character = retryCharacter
          
          logger.info('[Animator Characters API] Created after retry:', character.id)
          return NextResponse.json({ character }, { status: 201 })
        } catch (retryError: any) {
          logger.error('[Animator Characters API] Retry failed:', retryError)
          throw insertError // Возвращаем исходную ошибку
        }
      }
      throw insertError
    }
  } catch (error: any) {
    logger.error('[Animator Characters API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
