import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import prisma from '@/lib/prisma'

// POST /api/generate-legal-docs - генерация юридических документов
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_id, doc_type, data } = body
    // doc_type: 'contract' | 'agreement' | 'invoice' | 'act'

    if (!profile_id || !doc_type) {
      return NextResponse.json(
        { error: 'profile_id and doc_type are required' },
        { status: 400 }
      )
    }

    // Проверка прав
    const profile = await prisma.profiles.findUnique({
      where: { id: profile_id },
      select: {
        user_id: true,
        display_name: true,
        legal_form: true,
        inn: true,
        ogrn: true,
        legal_address: true,
        bank_details: true
      }
    })

    if (!profile || profile.user_id !== payload.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Проверка наличия юридических данных
    if (!profile.legal_form || !profile.inn) {
      return NextResponse.json(
        { error: 'Profile legal information is incomplete' },
        { status: 400 }
      )
    }

    // Генерация документа
    let documentContent = ''
    
    switch (doc_type) {
      case 'contract':
        documentContent = generateContract(profile, data)
        break
      case 'agreement':
        documentContent = generateAgreement(profile, data)
        break
      case 'invoice':
        documentContent = generateInvoice(profile, data)
        break
      case 'act':
        documentContent = generateAct(profile, data)
        break
      default:
        return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
    }

    // TODO: Конвертация в PDF через puppeteer или jsPDF
    // const pdf = await generatePDF(documentContent)
    // const pdfUrl = await uploadToStorage(pdf, `legal-docs/${profile_id}/${doc_type}-${Date.now()}.pdf`)

    return NextResponse.json({
      document_type: doc_type,
      content: documentContent,
      pdf_url: null, // В будущем - ссылка на PDF
      message: 'PDF generation is in development. Use content for now.'
    })
  } catch (error: any) {
    console.error('Error generating legal document:', error)
    return NextResponse.json(
      { error: 'Failed to generate document', details: error.message },
      { status: 500 }
    )
  }
}

function generateContract(profile: any, data: any): string {
  return `
ДОГОВОР № ${data.number || '___'} на оказание услуг

г. ${data.city || 'Санкт-Петербург'}                                      ${new Date().toLocaleDateString('ru-RU')}

${profile.legal_form} "${profile.display_name}", именуемое в дальнейшем "Исполнитель", 
в лице ${data.representative || '___'}, действующего на основании ${data.basis || 'Устава'}, 
с одной стороны, и

${data.client_name || '___'}, именуемый в дальнейшем "Заказчик", с другой стороны, 
заключили настоящий договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА
1.1. Исполнитель обязуется оказать услуги по проведению ${data.service_name || 'мероприятия'}, 
а Заказчик обязуется принять и оплатить эти услуги.

2. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЕТОВ
2.1. Стоимость услуг составляет: ${data.price || '___'} рублей.
2.2. Оплата производится ${data.payment_terms || 'по факту оказания услуг'}.

3. ОТВЕТСТВЕННОСТЬ СТОРОН
...

ИНН: ${profile.inn}
ОГРН: ${profile.ogrn || '___'}
Адрес: ${profile.legal_address || '___'}

Исполнитель: ________________
  `.trim()
}

function generateAgreement(profile: any, data: any): string {
  return `СОГЛАШЕНИЕ об оказании услуг\n\n...`
}

function generateInvoice(profile: any, data: any): string {
  return `
СЧЕТ № ${data.invoice_number || '___'}
от ${new Date().toLocaleDateString('ru-RU')}

Исполнитель: ${profile.display_name}
ИНН: ${profile.inn}

Заказчик: ${data.client_name || '___'}

Наименование услуги: ${data.service_name || '___'}
Стоимость: ${data.price || '___'} руб.

Итого к оплате: ${data.price || '___'} руб.
  `.trim()
}

function generateAct(profile: any, data: any): string {
  return `
АКТ оказанных услуг № ${data.act_number || '___'}
от ${new Date().toLocaleDateString('ru-RU')}

Исполнитель: ${profile.display_name}
Заказчик: ${data.client_name || '___'}

Услуги оказаны в полном объеме, претензий нет.

Исполнитель: ________________
Заказчик: ________________
  `.trim()
}



