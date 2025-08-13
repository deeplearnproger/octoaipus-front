export interface ImageCorrectionResult {
  correctedImage: string;
  originalImage: string;
  corrections: {
    rotation: number;
    brightness: number;
    contrast: number;
    sharpness: number;
  };
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    // Инициализируем canvas только в браузере
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
    }
  }

  private ensureCanvas() {
    if (!this.canvas || !this.ctx) {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
      } else {
        throw new Error('Canvas is not available in this environment');
      }
    }
  }

  /**
   * Основная функция для обработки изображения
   */
  async processImage(file: File): Promise<ImageCorrectionResult> {
    this.ensureCanvas();
    const image = await this.loadImage(file);
    
    // Устанавливаем размер canvas
    this.canvas!.width = image.width;
    this.canvas!.height = image.height;
    
    // Применяем коррекции
    const corrections = await this.autoCorrect(image);
    
    // Рисуем обработанное изображение
    this.ctx!.drawImage(image, 0, 0);
    this.applyCorrections(corrections);
    
    const correctedImage = this.canvas!.toDataURL('image/jpeg', 0.9);
    const originalImage = await this.fileToDataURL(file);
    
    return {
      correctedImage,
      originalImage,
      corrections
    };
  }

  /**
   * Загрузка изображения
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Конвертация файла в DataURL
   */
  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Автоматическая коррекция изображения
   */
  private async autoCorrect(image: HTMLImageElement) {
    // Анализируем изображение для определения необходимых коррекций
    const analysis = await this.analyzeImage(image);
    
    return {
      rotation: this.calculateRotation(analysis),
      brightness: this.calculateBrightness(analysis),
      contrast: this.calculateContrast(analysis),
      sharpness: this.calculateSharpness(analysis)
    };
  }

  /**
   * Анализ изображения
   */
  private async analyzeImage(image: HTMLImageElement) {
    // Создаем временный canvas для анализа
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;
    
    let totalBrightness = 0;
    let totalContrast = 0;
    let edgeCount = 0;
    
    // Анализируем каждый пиксель
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Яркость (среднее значение RGB)
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      // Простой детектор краев (контраст)
      if (i > 0 && i < data.length - 4) {
        const prevBrightness = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
        const contrast = Math.abs(brightness - prevBrightness);
        totalContrast += contrast;
        
        if (contrast > 30) edgeCount++;
      }
    }
    
    const pixelCount = data.length / 4;
    const avgBrightness = totalBrightness / pixelCount;
    const avgContrast = totalContrast / pixelCount;
    const edgeDensity = edgeCount / pixelCount;
    
    return {
      avgBrightness,
      avgContrast,
      edgeDensity,
      width: image.width,
      height: image.height
    };
  }

  /**
   * Расчет необходимого поворота
   */
  private calculateRotation(analysis: any): number {
    // Простая логика: если изображение слишком узкое или широкое, поворачиваем
    const aspectRatio = analysis.width / analysis.height;
    
    if (aspectRatio < 0.5) return 90; // Слишком узкое - поворачиваем
    if (aspectRatio > 2) return -90; // Слишком широкое - поворачиваем
    
    return 0;
  }

  /**
   * Расчет коррекции яркости
   */
  private calculateBrightness(analysis: any): number {
    const targetBrightness = 128; // Целевая яркость для рентгеновских снимков
    const difference = targetBrightness - analysis.avgBrightness;
    
    // Нормализуем разницу до диапазона -50 до 50
    return Math.max(-50, Math.min(50, difference / 2));
  }

  /**
   * Расчет коррекции контраста
   */
  private calculateContrast(analysis: any): number {
    const targetContrast = 50; // Целевой контраст
    const difference = targetContrast - analysis.avgContrast;
    
    // Нормализуем разницу до диапазона -30 до 30
    return Math.max(-30, Math.min(30, difference / 2));
  }

  /**
   * Расчет коррекции резкости
   */
  private calculateSharpness(analysis: any): number {
    const targetEdgeDensity = 0.1; // Целевая плотность краев
    const difference = targetEdgeDensity - analysis.edgeDensity;
    
    // Нормализуем разницу до диапазона -20 до 20
    return Math.max(-20, Math.min(20, difference * 100));
  }

  /**
   * Применение коррекций к изображению
   */
  private applyCorrections(corrections: any) {
    this.ensureCanvas();
    const imageData = this.ctx!.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
    const data = imageData.data;
    
    // Применяем поворот
    if (corrections.rotation !== 0) {
      this.rotateCanvas(corrections.rotation);
    }
    
    // Применяем яркость и контраст
    for (let i = 0; i < data.length; i += 4) {
      // Яркость
      data[i] = Math.max(0, Math.min(255, data[i] + corrections.brightness));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + corrections.brightness));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + corrections.brightness));
      
      // Контраст
      const factor = (259 * (corrections.contrast + 255)) / (255 * (259 - corrections.contrast));
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
    
    this.ctx!.putImageData(imageData, 0, 0);
    
    // Применяем резкость (простой unsharp mask)
    if (Math.abs(corrections.sharpness) > 5) {
      this.applySharpness(corrections.sharpness);
    }
  }

  /**
   * Поворот canvas
   */
  private rotateCanvas(degrees: number) {
    this.ensureCanvas();
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const newWidth = Math.abs(this.canvas!.width * cos) + Math.abs(this.canvas!.height * sin);
    const newHeight = Math.abs(this.canvas!.width * sin) + Math.abs(this.canvas!.height * cos);
    
    const newCanvas = document.createElement('canvas');
    const newCtx = newCanvas.getContext('2d')!;
    
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    
    newCtx.translate(newWidth / 2, newHeight / 2);
    newCtx.rotate(radians);
    newCtx.drawImage(this.canvas!, -this.canvas!.width / 2, -this.canvas!.height / 2);
    
    this.canvas!.width = newWidth;
    this.canvas!.height = newHeight;
    this.ctx!.drawImage(newCanvas, 0, 0);
  }

  /**
   * Применение резкости
   */
  private applySharpness(amount: number) {
    this.ensureCanvas();
    const imageData = this.ctx!.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
    const data = imageData.data;
    const width = this.canvas!.width;
    const height = this.canvas!.height;
    
    // Простой unsharp mask
    const factor = amount / 100;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Вычисляем среднее значение соседних пикселей
        let avgR = 0, avgG = 0, avgB = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            avgR += data[nIdx];
            avgG += data[nIdx + 1];
            avgB += data[nIdx + 2];
          }
        }
        avgR /= 9;
        avgG /= 9;
        avgB /= 9;
        
        // Применяем unsharp mask
        data[idx] = Math.max(0, Math.min(255, data[idx] + factor * (data[idx] - avgR)));
        data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + factor * (data[idx + 1] - avgG)));
        data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + factor * (data[idx + 2] - avgB)));
      }
    }
    
    this.ctx!.putImageData(imageData, 0, 0);
  }

  /**
   * Проверка, является ли изображение рентгеновским снимком
   */
  async isChestXray(file: File): Promise<boolean> {
    try {
      const image = await this.loadImage(file);
      
      // Проверяем соотношение сторон (типичное для рентгеновских снимков)
      const aspectRatio = image.width / image.height;
      if (aspectRatio < 0.6 || aspectRatio > 1.8) return false;
      
      // Анализируем яркость
      const analysis = await this.analyzeImage(image);
      
      // Рентгеновские снимки имеют специфическую яркость
      if (analysis.avgBrightness < 40 || analysis.avgBrightness > 180) return false;
      
      // Рентгеновские снимки имеют низкую контрастность
      if (analysis.avgContrast > 80) return false;
      
      // Дополнительная проверка: рентгеновские снимки обычно монохромные
      // Проверяем разницу между каналами RGB
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      tempCtx.drawImage(image, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;
      
      let totalColorDiff = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        totalColorDiff += maxDiff;
      }
      const avgColorDiff = totalColorDiff / (data.length / 4);
      
      // Если изображение слишком цветное, это не рентген
      if (avgColorDiff > 30) return false;
      
      return true;
    } catch (error) {
      console.error('Error in isChestXray check:', error);
      return false;
    }
  }
}

// Экспортируем функцию для создания экземпляра только в браузере
export const getImageProcessor = () => {
  if (typeof window === 'undefined') {
    throw new Error('ImageProcessor is only available in browser environment');
  }
  return new ImageProcessor();
}; 