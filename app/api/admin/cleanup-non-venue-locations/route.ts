
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth/jwt'


/**
 * DELETE /api/admin/cleanup-non-venue-locations
 * Удаляет profile_locations для профилей не категории 'venue'
 * Доступно только админу
 */











