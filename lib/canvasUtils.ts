export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  filters?: { brightness?: number; contrast?: number },
  /**
   * Если передан, итоговый кроп будет принудительно приведён к точному aspect ratio.
   * Это устраняет расхождения из-за округлений/масштабирования (например, для 21:9).
   */
  targetAspect?: number
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // ВАЖНО: canvas width/height — целые числа.
  // Если оставить float, браузер молча приведёт к int, а математика (translate/crop)
  // будет считать по float → появляются сдвиги, особенно при rotation.
  const safeBoxWidth = Math.ceil(bBoxWidth)
  const safeBoxHeight = Math.ceil(bBoxHeight)

  // set canvas size to match the bounding box
  canvas.width = safeBoxWidth
  canvas.height = safeBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(safeBoxWidth / 2, safeBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Apply filters if provided
  if (filters) {
    const filterString = `brightness(${filters.brightness || 100}%) contrast(${filters.contrast || 100}%)`
    ctx.filter = filterString
  }

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  const normalizePixelCrop = (
    crop: { x: number; y: number; width: number; height: number },
    boundingWidth: number,
    boundingHeight: number,
    aspect: number
  ) => {
    // 1) Приводим к точному aspect ratio, центрируя по лишней оси
    let { x, y, width, height } = crop
    const current = width / height

    if (Number.isFinite(aspect) && aspect > 0 && Math.abs(current - aspect) > 0.001) {
      if (current > aspect) {
        // Слишком широко → уменьшаем width
        const newWidth = height * aspect
        x = x + (width - newWidth) / 2
        width = newWidth
      } else {
        // Слишком узко/высоко → уменьшаем height
        const newHeight = width / aspect
        y = y + (height - newHeight) / 2
        height = newHeight
      }
    }

    // 2) Округляем до пикселей (canvas работает в целых)
    x = Math.round(x)
    y = Math.round(y)
    width = Math.round(width)
    height = Math.round(height)

    // 3) Клампим внутрь bounding box
    if (x < 0) x = 0
    if (y < 0) y = 0
    if (x + width > boundingWidth) x = Math.max(0, boundingWidth - width)
    if (y + height > boundingHeight) y = Math.max(0, boundingHeight - height)

    // 4) Защита от нулевых/отрицательных размеров
    width = Math.max(1, Math.min(width, Math.floor(boundingWidth)))
    height = Math.max(1, Math.min(height, Math.floor(boundingHeight)))

    return { x, y, width, height }
  }

  const finalCrop =
    typeof targetAspect === 'number'
      ? normalizePixelCrop(pixelCrop, safeBoxWidth, safeBoxHeight, targetAspect)
      : {
          x: Math.round(pixelCrop.x),
          y: Math.round(pixelCrop.y),
          width: Math.round(pixelCrop.width),
          height: Math.round(pixelCrop.height),
        }

  // Вырезаем результат во второй canvas через drawImage (точнее и быстрее, чем getImageData/putImageData).
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = finalCrop.width
  outputCanvas.height = finalCrop.height
  const outputCtx = outputCanvas.getContext('2d')
  if (!outputCtx) return null

  outputCtx.drawImage(
    canvas,
    finalCrop.x,
    finalCrop.y,
    finalCrop.width,
    finalCrop.height,
    0,
    0,
    finalCrop.width,
    finalCrop.height
  )

  // As Blob
  return new Promise((resolve) => {
    outputCanvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg', 1)
  })
}

