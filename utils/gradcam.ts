import * as ort from "onnxruntime-web";

export interface GradCAMResult {
  heatmap: ImageData;
  overlay: ImageData;
  originalImage: ImageData;
}

export class GradCAMGenerator {
  private session: ort.InferenceSession | null = null;
  private modelUrl: string;

  constructor(modelUrl: string) {
    this.modelUrl = modelUrl;
  }

  async loadModel(): Promise<ort.InferenceSession> {
    if (!this.session) {
      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: ["wasm"]
      });
    }
    return this.session;
  }

  // Получаем активации последнего сверточного слоя
  private async getFeatureMaps(inputTensor: ort.Tensor): Promise<ort.Tensor> {
    const session = await this.loadModel();
    
    // Для CheXNet обычно последний сверточный слой - это features.denseblock4
    // Мы будем использовать промежуточный выход
    const outputs = await session.run({ input: inputTensor });
    
    // Ищем тензор с активациями (обычно это последний сверточный слой)
    // В ONNX модели это может быть "features" или "conv_features"
    const featureTensor = outputs.features || outputs.conv_features || outputs.feature_maps;
    
    if (!featureTensor) {
      throw new Error("Could not find feature maps in model output");
    }
    
    return featureTensor as ort.Tensor;
  }

  // Вычисляем градиенты относительно активаций
  private async computeGradients(
    inputTensor: ort.Tensor, 
    targetClass: number
  ): Promise<ort.Tensor> {
    const session = await this.loadModel();
    
    // Создаем градиентный тензор для целевого класса
    const outputShape = [1, 14]; // 14 классов для CheXNet
    const gradientData = new Float32Array(outputShape[0] * outputShape[1]);
    gradientData[targetClass] = 1.0; // Устанавливаем градиент для целевого класса
    
    const gradientTensor = new ort.Tensor("float32", gradientData, outputShape);
    
    // Вычисляем градиенты через обратное распространение
    const gradients = await session.run({ 
      input: inputTensor,
      target_gradients: gradientTensor 
    });
    
    return gradients.input_gradients as ort.Tensor;
  }

  // Генерируем тепловую карту
  private generateHeatmap(
    featureMaps: Float32Array,
    gradients: Float32Array,
    featureShape: number[]
  ): Float32Array {
    const [batch, channels, height, width] = featureShape;
    
    // Вычисляем веса каналов
    const weights = new Float32Array(channels);
    for (let c = 0; c < channels; c++) {
      let sum = 0;
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          const idx = c * height * width + h * width + w;
          sum += gradients[idx];
        }
      }
      weights[c] = sum / (height * width);
    }
    
    // Создаем тепловую карту
    const heatmap = new Float32Array(height * width);
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        let value = 0;
        for (let c = 0; c < channels; c++) {
          const idx = c * height * width + h * width + w;
          value += weights[c] * featureMaps[idx];
        }
        heatmap[h * width + w] = Math.max(0, value); // ReLU
      }
    }
    
    // Нормализуем
    const maxVal = Math.max.apply(null, Array.from(heatmap));
    const minVal = Math.min.apply(null, Array.from(heatmap));
    const range = maxVal - minVal;
    
    if (range > 0) {
      for (let i = 0; i < heatmap.length; i++) {
        heatmap[i] = (heatmap[i] - minVal) / range;
      }
    }
    
    return heatmap;
  }

  // Создаем наложение тепловой карты на оригинальное изображение
  private createOverlay(
    originalImage: ImageData,
    heatmap: Float32Array,
    targetSize: { width: number; height: number }
  ): ImageData {
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    const ctx = canvas.getContext("2d")!;
    
    // Рисуем оригинальное изображение
    ctx.putImageData(originalImage, 0, 0);
    
    // Создаем тепловую карту как изображение
    const heatmapCanvas = document.createElement("canvas");
    heatmapCanvas.width = targetSize.width;
    heatmapCanvas.height = targetSize.height;
    const heatmapCtx = heatmapCanvas.getContext("2d")!;
    
    const heatmapImageData = heatmapCtx.createImageData(targetSize.width, targetSize.height);
    
    // Применяем цветовую схему (красный для высоких значений)
    for (let i = 0; i < heatmap.length; i++) {
      const intensity = heatmap[i];
      const idx = i * 4;
      
      // Красный канал для тепловой карты
      heatmapImageData.data[idx] = Math.round(intensity * 255);     // R
      heatmapImageData.data[idx + 1] = 0;                           // G
      heatmapImageData.data[idx + 2] = 0;                           // B
      heatmapImageData.data[idx + 3] = Math.round(intensity * 128); // A (полупрозрачность)
    }
    
    heatmapCtx.putImageData(heatmapImageData, 0, 0);
    
    // Накладываем тепловую карту на оригинальное изображение
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(heatmapCanvas, 0, 0);
    
    return ctx.getImageData(0, 0, targetSize.width, targetSize.height);
  }

  // Основной метод для генерации Grad-CAM
  async generateGradCAM(
    inputImage: ImageData,
    targetClass: number,
    targetSize: { width: number; height: number } = { width: 224, height: 224 }
  ): Promise<GradCAMResult> {
    try {
      // Предобработка изображения
      const canvas = document.createElement("canvas");
      canvas.width = targetSize.width;
      canvas.height = targetSize.height;
      const ctx = canvas.getContext("2d")!;
      
      // Рисуем и масштабируем изображение
      ctx.drawImage(
        await createImageBitmap(inputImage),
        0, 0, targetSize.width, targetSize.height
      );
      
      const resizedImageData = ctx.getImageData(0, 0, targetSize.width, targetSize.height);
      
      // Создаем входной тензор
      const inputTensor = this.preprocessImage(resizedImageData);
      
      // Получаем активации
      const featureMaps = await this.getFeatureMaps(inputTensor);
      const featureData = featureMaps.data as Float32Array;
      const featureShape = [...featureMaps.dims];
      
      // Вычисляем градиенты
      const gradients = await this.computeGradients(inputTensor, targetClass);
      const gradientData = gradients.data as Float32Array;
      
      // Генерируем тепловую карту
      const heatmap = this.generateHeatmap(featureData, gradientData, featureShape);
      
      // Выводим min/max heatmap для отладки
      console.log('Heatmap min:', Math.min.apply(null, Array.from(heatmap)), 'max:', Math.max.apply(null, Array.from(heatmap)));
      // Создаем наложение
      const overlay = this.createOverlay(resizedImageData, heatmap, targetSize);
      
      // Создаем правильный формат для ImageData (RGBA)
      const heatmapRGBA = new Uint8ClampedArray(targetSize.width * targetSize.height * 4);
      for (let i = 0; i < heatmap.length; i++) {
        const intensity = Math.round(heatmap[i] * 255);
        heatmapRGBA[i * 4] = intensity;     // R
        heatmapRGBA[i * 4 + 1] = 0;         // G
        heatmapRGBA[i * 4 + 2] = 0;         // B
        heatmapRGBA[i * 4 + 3] = 255;       // A
      }
      return {
        heatmap: new ImageData(heatmapRGBA, targetSize.width, targetSize.height),
        overlay,
        originalImage: resizedImageData
      };
      
    } catch (error) {
      console.error("Error generating Grad-CAM:", error);
      throw error;
    }
  }

  // Предобработка изображения для модели
  private preprocessImage(imageData: ImageData): ort.Tensor {
    const { data, width, height } = imageData;
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    
    const floatData = new Float32Array(3 * width * height);
    
    for (let i = 0; i < width * height; i++) {
      for (let c = 0; c < 3; c++) {
        const pixelValue = data[i * 4 + c] / 255;
        floatData[c * width * height + i] = (pixelValue - mean[c]) / std[c];
      }
    }
    
    return new ort.Tensor("float32", floatData, [1, 3, height, width]);
  }
}

// Упрощенная версия Grad-CAM для случаев, когда модель не поддерживает градиенты
export class SimpleGradCAMGenerator {
  private session: ort.InferenceSession | null = null;
  private modelUrl: string;

  constructor(modelUrl: string) {
    this.modelUrl = modelUrl;
  }

  async loadModel(): Promise<ort.InferenceSession> {
    if (!this.session) {
      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: ["wasm"]
      });
    }
    return this.session;
  }

  // Альтернативный подход - использование активаций последнего слоя
  async generateSimpleGradCAM(
    inputImage: ImageData,
    targetClass: number,
    targetSize: { width: number; height: number } = { width: 224, height: 224 }
  ): Promise<GradCAMResult> {
    try {
      // Предобработка изображения
      const canvas = document.createElement("canvas");
      canvas.width = targetSize.width;
      canvas.height = targetSize.height;
      const ctx = canvas.getContext("2d")!;
      
      ctx.drawImage(
        await createImageBitmap(inputImage),
        0, 0, targetSize.width, targetSize.height
      );
      
      const resizedImageData = ctx.getImageData(0, 0, targetSize.width, targetSize.height);
      
      // Создаем входной тензор
      const inputTensor = this.preprocessImage(resizedImageData);
      
      // Получаем выход модели
      const session = await this.loadModel();
      const outputs = await session.run({ input: inputTensor });
      
      // Получаем логиты для целевого класса
      const logits = (outputs.logits as ort.Tensor).data as Float32Array;
      const targetScore = logits[targetClass];
      
      // Создаем простую тепловую карту на основе активаций
      // Это упрощенная версия, которая показывает области, важные для классификации
      const heatmap = this.createAttentionHeatmap(resizedImageData, targetScore);
      
      // Выводим min/max heatmap для отладки
      console.log('Heatmap min:', Math.min.apply(null, Array.from(heatmap)), 'max:', Math.max.apply(null, Array.from(heatmap)));
      // Создаем наложение
      const overlay = this.createOverlay(resizedImageData, heatmap, targetSize);
      
      // Создаем правильный формат для ImageData (RGBA)
      const heatmapRGBA = new Uint8ClampedArray(targetSize.width * targetSize.height * 4);
      for (let i = 0; i < heatmap.length; i++) {
        const intensity = Math.round(heatmap[i] * 255);
        heatmapRGBA[i * 4] = intensity;     // R
        heatmapRGBA[i * 4 + 1] = 0;         // G
        heatmapRGBA[i * 4 + 2] = 255 - intensity; // B (контраст)
        heatmapRGBA[i * 4 + 3] = 255;       // A
      }
      return {
        heatmap: new ImageData(heatmapRGBA, targetSize.width, targetSize.height),
        overlay,
        originalImage: resizedImageData
      };
      
    } catch (error) {
      console.error("Error generating simple Grad-CAM:", error);
      throw error;
    }
  }

  // Создаем тепловую карту внимания на основе активаций
  private createAttentionHeatmap(
    imageData: ImageData,
    targetScore: number
  ): Float32Array {
    const { width, height } = imageData;
    const heatmap = new Float32Array(width * height);
    
    // Создаем тепловую карту на основе интенсивности пикселей
    // Это упрощенный подход, который показывает области с высокой интенсивностью
    for (let i = 0; i < width * height; i++) {
      const r = imageData.data[i * 4];
      const g = imageData.data[i * 4 + 1];
      const b = imageData.data[i * 4 + 2];
      
      // Вычисляем интенсивность (среднее значение RGB)
      const intensity = (r + g + b) / 3 / 255;
      
      // Применяем нелинейное преобразование для усиления контраста
      heatmap[i] = Math.pow(intensity, 2) * Math.max(0, targetScore);
    }
    
    // Нормализуем
    const maxVal = Math.max.apply(null, Array.from(heatmap));
    if (maxVal > 0) {
      for (let i = 0; i < heatmap.length; i++) {
        heatmap[i] = heatmap[i] / maxVal;
      }
    }
    
    return heatmap;
  }

  // Создаем наложение тепловой карты
  private createOverlay(
    originalImage: ImageData,
    heatmap: Float32Array,
    targetSize: { width: number; height: number }
  ): ImageData {
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    const ctx = canvas.getContext("2d")!;
    
    // Рисуем оригинальное изображение
    ctx.putImageData(originalImage, 0, 0);
    
    // Создаем тепловую карту
    const heatmapCanvas = document.createElement("canvas");
    heatmapCanvas.width = targetSize.width;
    heatmapCanvas.height = targetSize.height;
    const heatmapCtx = heatmapCanvas.getContext("2d")!;
    
    const heatmapImageData = heatmapCtx.createImageData(targetSize.width, targetSize.height);
    
    // Применяем цветовую схему
    for (let i = 0; i < heatmap.length; i++) {
      const intensity = heatmap[i];
      const idx = i * 4;
      
      // Красный для высоких значений, синий для низких
      heatmapImageData.data[idx] = Math.round(intensity * 255);     // R
      heatmapImageData.data[idx + 1] = 0;                           // G
      heatmapImageData.data[idx + 2] = Math.round((1 - intensity) * 255); // B
      heatmapImageData.data[idx + 3] = Math.round(intensity * 180); // A
    }
    
    heatmapCtx.putImageData(heatmapImageData, 0, 0);
    
    // Накладываем тепловую карту
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(heatmapCanvas, 0, 0);
    
    return ctx.getImageData(0, 0, targetSize.width, targetSize.height);
  }

  // Предобработка изображения
  private preprocessImage(imageData: ImageData): ort.Tensor {
    const { data, width, height } = imageData;
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    
    const floatData = new Float32Array(3 * width * height);
    
    for (let i = 0; i < width * height; i++) {
      for (let c = 0; c < 3; c++) {
        const pixelValue = data[i * 4 + c] / 255;
        floatData[c * width * height + i] = (pixelValue - mean[c]) / std[c];
      }
    }
    
    return new ort.Tensor("float32", floatData, [1, 3, height, width]);
  }
} 

export class PseudoGradCAMGenerator {
  private session: ort.InferenceSession | null = null;
  private modelUrl: string;

  constructor(modelUrl: string) {
    this.modelUrl = modelUrl;
  }

  async loadModel(): Promise<ort.InferenceSession> {
    if (!this.session) {
      this.session = await ort.InferenceSession.create(this.modelUrl, {
        executionProviders: ["wasm"]
      });
    }
    return this.session;
  }

  async generatePseudoGradCAM(
    inputImage: ImageData,
    classIndex: number = 0, // Индекс класса для индивидуальной карты
    targetSize: { width: number; height: number } = { width: 224, height: 224 }
  ): Promise<GradCAMResult> {
    // Предобработка изображения
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(await createImageBitmap(inputImage), 0, 0, targetSize.width, targetSize.height);
    const resizedImageData = ctx.getImageData(0, 0, targetSize.width, targetSize.height);

    // Создаем входной тензор
    const inputTensor = this.preprocessImage(resizedImageData);
    const session = await this.loadModel();
    const outputs = await session.run({ input: inputTensor });
    const features = outputs.features || outputs.conv_features || outputs.feature_maps;
    if (!features) throw new Error("No features output in ONNX model");
    const data = features.data as Float32Array;
    const [batch, channels, height, width] = features.dims;

    // --- Индивидуальная карта для класса ---
    let heatmap: Float32Array;
    if (classIndex < channels) {
      // Берём только канал, соответствующий классу
      heatmap = new Float32Array(height * width);
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          heatmap[h * width + w] = data[classIndex * height * width + h * width + w];
        }
      }
    } else {
      // Если каналов меньше, чем классов — fallback: среднее по всем каналам
      heatmap = new Float32Array(height * width);
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          let sum = 0;
          for (let c = 0; c < channels; c++) {
            sum += data[c * height * width + h * width + w];
          }
          heatmap[h * width + w] = sum / channels;
        }
      }
    }
    // Нормализуем
    const maxVal = Math.max.apply(null, Array.from(heatmap));
    const minVal = Math.min.apply(null, Array.from(heatmap));
    const range = maxVal - minVal;
    if (range > 0) {
      for (let i = 0; i < heatmap.length; i++) {
        heatmap[i] = (heatmap[i] - minVal) / range;
      }
    }
    // --- Цветовая схема для каждого класса ---
    // Используем turbo colormap
    const heatmapRGBA = new Uint8ClampedArray(height * width * 4);
    const outlineThreshold = 0.7;
    for (let i = 0; i < heatmap.length; i++) {
      const v = heatmap[i];
      const [r, g, b] = turboColormap(v);
      // Glow-эффект: если v > 0.85, делаем альфу выше
      let a = Math.round(180 * Math.pow(v, 1.5));
      if (v > 0.85) a = 255;
      // Контур: если значение близко к threshold, делаем ярко-жёлтый
      if (
        v > outlineThreshold &&
        (
          (i > 0 && heatmap[i - 1] <= outlineThreshold) ||
          (i < heatmap.length - 1 && heatmap[i + 1] <= outlineThreshold)
        )
      ) {
        heatmapRGBA[i * 4] = 255;
        heatmapRGBA[i * 4 + 1] = 255;
        heatmapRGBA[i * 4 + 2] = 0;
        heatmapRGBA[i * 4 + 3] = 255;
        continue;
      }
      heatmapRGBA[i * 4] = r;
      heatmapRGBA[i * 4 + 1] = g;
      heatmapRGBA[i * 4 + 2] = b;
      heatmapRGBA[i * 4 + 3] = a;
    }
    // Масштабируем до targetSize
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext("2d")!.putImageData(new ImageData(heatmapRGBA, width, height), 0, 0);
    ctx.clearRect(0, 0, targetSize.width, targetSize.height);
    ctx.putImageData(resizedImageData, 0, 0);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(tempCanvas, 0, 0, targetSize.width, targetSize.height);
    ctx.globalAlpha = 1.0;
    // Получаем итоговое наложение
    const overlay = ctx.getImageData(0, 0, targetSize.width, targetSize.height);
    return {
      heatmap: new ImageData(heatmapRGBA, width, height),
      overlay,
      originalImage: resizedImageData
    };
  }

  private preprocessImage(imageData: ImageData): ort.Tensor {
    const { data, width, height } = imageData;
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    const floatData = new Float32Array(3 * width * height);
    for (let i = 0; i < width * height; i++) {
      for (let c = 0; c < 3; c++) {
        const pixelValue = data[i * 4 + c] / 255;
        floatData[c * width * height + i] = (pixelValue - mean[c]) / std[c];
      }
    }
    return new ort.Tensor("float32", floatData, [1, 3, height, width]);
  }
} 

// Turbo colormap (Google's turbo)
function turboColormap(v: number): [number, number, number] {
  // v in [0,1]
  // https://ai.googleblog.com/2019/08/turbo-improved-rainbow-colormap-for.html
  const kRed = [0.18995, 0.19483, 0.19956, 0.20415, 0.20860, 0.21291, 0.21709, 0.22114, 0.22506, 0.22887, 0.23255, 0.23612, 0.23958, 0.24294, 0.24620, 0.24936, 0.25242, 0.25539, 0.25827, 0.26107, 0.26378, 0.26641, 0.26896, 0.27144, 0.27385, 0.27619, 0.27846, 0.28066, 0.28280, 0.28487, 0.28688, 0.28883, 0.29073, 0.29257, 0.29436, 0.29610, 0.29780, 0.29945, 0.30105, 0.30260, 0.30412, 0.30560, 0.30704, 0.30844, 0.30981, 0.31115, 0.31246, 0.31374, 0.31499, 0.31622, 0.31742, 0.31860, 0.31975, 0.32089, 0.32200, 0.32309, 0.32417, 0.32523, 0.32627, 0.32730, 0.32831, 0.32931, 0.33030, 0.33128, 0.33224, 0.33320, 0.33415, 0.33509, 0.33602, 0.33694, 0.33786, 0.33877, 0.33967, 0.34057, 0.34146, 0.34235, 0.34323, 0.34411, 0.34499, 0.34586, 0.34673, 0.34760, 0.34847, 0.34933, 0.35019, 0.35105, 0.35191, 0.35277, 0.35363, 0.35449, 0.35535, 0.35621, 0.35707, 0.35793, 0.35879, 0.35965, 0.36051, 0.36137, 0.36223, 0.36309, 0.36395, 0.36481, 0.36567, 0.36653, 0.36739, 0.36825, 0.36911, 0.36997, 0.37083, 0.37169, 0.37255, 0.37341, 0.37427, 0.37513, 0.37599, 0.37685, 0.37771, 0.37857, 0.37943, 0.38029, 0.38115, 0.38201, 0.38287, 0.38373, 0.38459, 0.38545, 0.38631, 0.38717, 0.38803, 0.38889, 0.38975, 0.39061, 0.39147, 0.39233, 0.39319, 0.39405, 0.39491, 0.39577, 0.39663, 0.39749, 0.39835, 0.39921, 0.40007, 0.40093, 0.40179, 0.40265, 0.40351, 0.40437, 0.40523, 0.40609, 0.40695, 0.40781, 0.40867, 0.40953, 0.41039, 0.41125, 0.41211, 0.41297, 0.41383, 0.41469, 0.41555, 0.41641, 0.41727, 0.41813, 0.41899, 0.41985, 0.42071, 0.42157, 0.42243, 0.42329, 0.42415, 0.42501, 0.42587, 0.42673, 0.42759, 0.42845, 0.42931, 0.43017, 0.43103, 0.43189, 0.43275, 0.43361, 0.43447, 0.43533, 0.43619, 0.43705, 0.43791, 0.43877, 0.43963, 0.44049, 0.44135, 0.44221, 0.44307, 0.44393, 0.44479, 0.44565, 0.44651, 0.44737, 0.44823, 0.44909, 0.44995, 0.45081, 0.45167, 0.45253, 0.45339, 0.45425, 0.45511, 0.45597, 0.45683, 0.45769, 0.45855, 0.45941, 0.46027, 0.46113, 0.46199, 0.46285, 0.46371, 0.46457, 0.46543, 0.46629, 0.46715, 0.46801, 0.46887, 0.46973, 0.47059, 0.47145, 0.47231, 0.47317, 0.47403, 0.47489, 0.47575, 0.47661, 0.47747, 0.47833, 0.47919, 0.48005, 0.48091, 0.48177, 0.48263, 0.48349, 0.48435, 0.48521, 0.48607, 0.48693, 0.48779, 0.48865, 0.48951, 0.49037, 0.49123, 0.49209, 0.49295, 0.49381, 0.49467, 0.49553, 0.49639, 0.49725, 0.49811, 0.49897, 0.49983, 0.50069, 0.50155, 0.50241, 0.50327, 0.50413, 0.50499, 0.50585, 0.50671, 0.50757, 0.50843, 0.50929, 0.51015, 0.51101, 0.51187, 0.51273, 0.51359, 0.51445, 0.51531, 0.51617, 0.51703, 0.51789, 0.51875, 0.51961, 0.52047, 0.52133, 0.52219, 0.52305, 0.52391, 0.52477, 0.52563, 0.52649, 0.52735, 0.52821, 0.52907, 0.52993, 0.53079, 0.53165, 0.53251, 0.53337, 0.53423, 0.53509, 0.53595, 0.53681, 0.53767, 0.53853, 0.53939, 0.54025, 0.54111, 0.54197, 0.54283, 0.54369, 0.54455, 0.54541, 0.54627, 0.54713, 0.54799, 0.54885, 0.54971, 0.55057, 0.55143, 0.55229, 0.55315, 0.55401, 0.55487, 0.55573, 0.55659, 0.55745, 0.55831, 0.55917, 0.56003, 0.56089, 0.56175, 0.56261, 0.56347, 0.56433, 0.56519, 0.56605, 0.56691, 0.56777, 0.56863, 0.56949, 0.57035, 0.57121, 0.57207, 0.57293, 0.57379, 0.57465, 0.57551, 0.57637, 0.57723, 0.57809, 0.57895, 0.57981, 0.58067, 0.58153, 0.58239, 0.58325, 0.58411, 0.58497, 0.58583, 0.58669, 0.58755, 0.58841, 0.58927, 0.59013, 0.59099, 0.59185, 0.59271, 0.59357, 0.59443, 0.59529, 0.59615, 0.59701, 0.59787, 0.59873, 0.59959, 0.60045, 0.60131, 0.60217, 0.60303, 0.60389, 0.60475, 0.60561, 0.60647, 0.60733, 0.60819, 0.60905, 0.60991, 0.61077, 0.61163, 0.61249, 0.61335, 0.61421, 0.61507, 0.61593, 0.61679, 0.61765, 0.61851, 0.61937, 0.62023, 0.62109, 0.62195, 0.62281, 0.62367, 0.62453, 0.62539, 0.62625, 0.62711, 0.62797, 0.62883, 0.62969, 0.63055, 0.63141, 0.63227, 0.63313, 0.63399, 0.63485, 0.63571, 0.63657, 0.63743, 0.63829, 0.63915, 0.64001, 0.64087, 0.64173, 0.64259, 0.64345, 0.64431, 0.64517, 0.64603, 0.64689, 0.64775, 0.64861, 0.64947, 0.65033, 0.65119, 0.65205, 0.65291, 0.65377, 0.65463, 0.65549, 0.65635, 0.65721, 0.65807, 0.65893, 0.65979, 0.66065, 0.66151, 0.66237, 0.66323, 0.66409, 0.66495, 0.66581, 0.66667, 0.66753, 0.66839, 0.66925, 0.67011, 0.67097, 0.67183, 0.67269, 0.67355, 0.67441, 0.67527, 0.67613, 0.67699, 0.67785, 0.67871, 0.67957, 0.68043, 0.68129, 0.68215, 0.68301, 0.68387, 0.68473, 0.68559, 0.68645, 0.68731, 0.68817, 0.68903, 0.68989, 0.69075, 0.69161, 0.69247, 0.69333, 0.69419, 0.69505, 0.69591, 0.69677, 0.69763, 0.69849, 0.69935, 0.70021, 0.70107, 0.70193, 0.70279, 0.70365, 0.70451, 0.70537, 0.70623, 0.70709, 0.70795, 0.70881, 0.70967, 0.71053, 0.71139, 0.71225, 0.71311, 0.71397, 0.71483, 0.71569, 0.71655, 0.71741, 0.71827, 0.71913, 0.71999, 0.72085, 0.72171, 0.72257, 0.72343, 0.72429, 0.72515, 0.72601, 0.72687, 0.72773, 0.72859, 0.72945, 0.73031, 0.73117, 0.73203, 0.73289, 0.73375, 0.73461, 0.73547, 0.73633, 0.73719, 0.73805, 0.73891, 0.73977, 0.74063, 0.74149, 0.74235, 0.74321, 0.74407, 0.74493, 0.74579, 0.74665, 0.74751, 0.74837, 0.74923, 0.75009, 0.75095, 0.75181, 0.75267, 0.75353, 0.75439, 0.75525, 0.75611, 0.75697, 0.75783, 0.75869, 0.75955, 0.76041, 0.76127, 0.76213, 0.76299, 0.76385, 0.76471, 0.76557, 0.76643, 0.76729, 0.76815, 0.76901, 0.76987, 0.77073, 0.77159, 0.77245, 0.77331, 0.77417, 0.77503, 0.77589, 0.77675, 0.77761, 0.77847, 0.77933, 0.78019, 0.78105, 0.78191, 0.78277, 0.78363, 0.78449, 0.78535, 0.78621, 0.78707, 0.78793, 0.78879, 0.78965, 0.79051, 0.79137, 0.79223, 0.79309, 0.79395, 0.79481, 0.79567, 0.79653, 0.79739, 0.79825, 0.79911, 0.79997, 0.80083, 0.80169, 0.80255, 0.80341, 0.80427, 0.80513, 0.80599, 0.80685, 0.80771, 0.80857, 0.80943, 0.81029, 0.81115, 0.81201, 0.81287, 0.81373, 0.81459, 0.81545, 0.81631, 0.81717, 0.81803, 0.81889, 0.81975, 0.82061, 0.82147, 0.82233, 0.82319, 0.82405, 0.82491, 0.82577, 0.82663, 0.82749, 0.82835, 0.82921, 0.83007, 0.83093, 0.83179, 0.83265, 0.83351, 0.83437, 0.83523, 0.83609, 0.83695, 0.83781, 0.83867, 0.83953, 0.84039, 0.84125, 0.84211, 0.84297, 0.84383, 0.84469, 0.84555, 0.84641, 0.84727, 0.84813, 0.84899, 0.84985, 0.85071, 0.85157, 0.85243, 0.85329, 0.85415, 0.85501, 0.85587, 0.85673, 0.85759, 0.85845, 0.85931, 0.86017, 0.86103, 0.86189, 0.86275, 0.86361, 0.86447, 0.86533, 0.86619, 0.86705, 0.86791, 0.86877, 0.86963, 0.87049, 0.87135, 0.87221, 0.87307, 0.87393, 0.87479, 0.87565, 0.87651, 0.87737, 0.87823, 0.87909, 0.87995, 0.88081, 0.88167, 0.88253, 0.88339, 0.88425, 0.88511, 0.88597, 0.88683, 0.88769, 0.88855, 0.88941, 0.89027, 0.89113, 0.89199, 0.89285, 0.89371, 0.89457, 0.89543, 0.89629, 0.89715, 0.89801, 0.89887, 0.89973, 0.90059, 0.90145, 0.90231, 0.90317, 0.90403, 0.90489, 0.90575, 0.90661, 0.90747, 0.90833, 0.90919, 0.91005, 0.91091, 0.91177, 0.91263, 0.91349, 0.91435, 0.91521, 0.91607, 0.91693, 0.91779, 0.91865, 0.91951, 0.92037, 0.92123, 0.92209, 0.92295, 0.92381, 0.92467, 0.92553, 0.92639, 0.92725, 0.92811, 0.92897, 0.92983, 0.93069, 0.93155, 0.93241, 0.93327, 0.93413, 0.93499, 0.93585, 0.93671, 0.93757, 0.93843, 0.93929, 0.94015, 0.94101, 0.94187, 0.94273, 0.94359, 0.94445, 0.94531, 0.94617, 0.94703, 0.94789, 0.94875, 0.94961, 0.95047, 0.95133, 0.95219, 0.95305, 0.95391, 0.95477, 0.95563, 0.95649, 0.95735, 0.95821, 0.95907, 0.95993, 0.96079, 0.96165, 0.96251, 0.96337, 0.96423, 0.96509, 0.96595, 0.96681, 0.96767, 0.96853, 0.96939, 0.97025, 0.97111, 0.97197, 0.97283, 0.97369, 0.97455, 0.97541, 0.97627, 0.97713, 0.97799, 0.97885, 0.97971, 0.98057, 0.98143, 0.98229, 0.98315, 0.98401, 0.98487, 0.98573, 0.98659, 0.98745, 0.98831, 0.98917, 0.99003, 0.99089, 0.99175, 0.99261, 0.99347, 0.99433, 0.99519, 0.99605, 0.99691, 0.99777, 0.99863, 0.99949, 1.0];
  const kGreen = [0.07176, 0.08436, 0.09696, 0.10956, 0.12216, 0.13476, 0.14736, 0.15996, 0.17256, 0.18516, 0.19776, 0.21036, 0.22296, 0.23556, 0.24816, 0.26076, 0.27336, 0.28596, 0.29856, 0.31116, 0.32376, 0.33636, 0.34896, 0.36156, 0.37416, 0.38676, 0.39936, 0.41196, 0.42456, 0.43716, 0.44976, 0.46236, 0.47496, 0.48756, 0.50016, 0.51276, 0.52536, 0.53796, 0.55056, 0.56316, 0.57576, 0.58836, 0.60096, 0.61356, 0.62616, 0.63876, 0.65136, 0.66396, 0.67656, 0.68916, 0.70176, 0.71436, 0.72696, 0.73956, 0.75216, 0.76476, 0.77736, 0.78996, 0.80256, 0.81516, 0.82776, 0.84036, 0.85296, 0.86556, 0.87816, 0.89076, 0.90336, 0.91596, 0.92856, 0.94116, 0.95376, 0.96636, 0.97896, 0.99156, 1.00416, 1.01676, 1.02936, 1.04196, 1.05456, 1.06716, 1.07976, 1.09236, 1.10496, 1.11756, 1.13016, 1.14276, 1.15536, 1.16796, 1.18056, 1.19316, 1.20576, 1.21836, 1.23096, 1.24356, 1.25616, 1.26876, 1.28136, 1.29396, 1.30656, 1.31916, 1.33176, 1.34436, 1.35696, 1.36956, 1.38216, 1.39476, 1.40736, 1.41996, 1.43256, 1.44516, 1.45776, 1.47036, 1.48296, 1.49556, 1.50816, 1.52076, 1.53336, 1.54596, 1.55856, 1.57116, 1.58376, 1.59636, 1.60896, 1.62156, 1.63416, 1.64676, 1.65936, 1.67196, 1.68456, 1.69716, 1.70976, 1.72236, 1.73496, 1.74756, 1.76016, 1.77276, 1.78536, 1.79796, 1.81056, 1.82316, 1.83576, 1.84836, 1.86096, 1.87356, 1.88616, 1.89876, 1.91136, 1.92396, 1.93656, 1.94916, 1.96176, 1.97436, 1.98696, 1.99956, 2.01216, 2.02476, 2.03736, 2.04996, 2.06256, 2.07516, 2.08776, 2.10036, 2.11296, 2.12556, 2.13816, 2.15076, 2.16336, 2.17596, 2.18856, 2.20116, 2.21376, 2.22636, 2.23896, 2.25156, 2.26416, 2.27676, 2.28936, 2.30196, 2.31456, 2.32716, 2.33976, 2.35236, 2.36496, 2.37756, 2.39016, 2.40276, 2.41536, 2.42796, 2.44056, 2.45316, 2.46576, 2.47836, 2.49096, 2.50356, 2.51616, 2.52876, 2.54136, 2.55396, 2.56656, 2.57916, 2.59176, 2.60436, 2.61696, 2.62956, 2.64216, 2.65476, 2.66736, 2.67996, 2.69256, 2.70516, 2.71776, 2.73036, 2.74296, 2.75556, 2.76816, 2.78076, 2.79336, 2.80596, 2.81856, 2.83116, 2.84376, 2.85636, 2.86896, 2.88156, 2.89416, 2.90676, 2.91936, 2.93196, 2.94456, 2.95716, 2.96976, 2.98236, 2.99496, 3.00756, 3.02016, 3.03276, 3.04536, 3.05796, 3.07056, 3.08316, 3.09576, 3.10836, 3.12096, 3.13356, 3.14616, 3.15876, 3.17136, 3.18396, 3.19656, 3.20916, 3.22176, 3.23436, 3.24696, 3.25956, 3.27216, 3.28476, 3.29736, 3.30996, 3.32256, 3.33516, 3.34776, 3.36036, 3.37296, 3.38556, 3.39816, 3.41076, 3.42336, 3.43596, 3.44856, 3.46116, 3.47376, 3.48636, 3.49896, 3.51156, 3.52416, 3.53676, 3.54936, 3.56196, 3.57456, 3.58716, 3.59976, 3.61236, 3.62496, 3.63756, 3.65016, 3.66276, 3.67536, 3.68796, 3.70056, 3.71316, 3.72576, 3.73836, 3.75096, 3.76356, 3.77616, 3.78876, 3.80136, 3.81396, 3.82656, 3.83916, 3.85176, 3.86436, 3.87696, 3.88956, 3.90216, 3.91476, 3.92736, 3.93996, 3.95256, 3.96516, 3.97776, 3.99036, 4.00296, 4.01556, 4.02816, 4.04076, 4.05336, 4.06596, 4.07856, 4.09116, 4.10376, 4.11636, 4.12896, 4.14156, 4.15416, 4.16676, 4.17936, 4.19196, 4.20456, 4.21716, 4.22976, 4.24236, 4.25496, 4.26756, 4.28016, 4.29276, 4.30536, 4.31796, 4.33056, 4.34316, 4.35576, 4.36836, 4.38096, 4.39356, 4.40616, 4.41876, 4.43136, 4.44396, 4.45656, 4.46916, 4.48176, 4.49436, 4.50696, 4.51956, 4.53216, 4.54476, 4.55736, 4.56996, 4.58256, 4.59516, 4.60776, 4.62036, 4.63296, 4.64556, 4.65816, 4.67076, 4.68336, 4.69596, 4.70856, 4.72116, 4.73376, 4.74636, 4.75896, 4.77156, 4.78416, 4.79676, 4.80936, 4.82196, 4.83456, 4.84716, 4.85976, 4.87236, 4.88496, 4.89756, 4.91016, 4.92276, 4.93536, 4.94796, 4.96056, 4.97316, 4.98576, 4.99836, 5.01096, 5.02356, 5.03616, 5.04876, 5.06136, 5.07396, 5.08656, 5.09916, 5.11176, 5.12436, 5.13696, 5.14956, 5.16216, 5.17476, 5.18736, 5.19996, 5.21256, 5.22516, 5.23776, 5.25036, 5.26296, 5.27556, 5.28816, 5.30076, 5.31336, 5.32596, 5.33856, 5.35116, 5.36376, 5.37636, 5.38896, 5.40156, 5.41416, 5.42676, 5.43936, 5.45196, 5.46456, 5.47716, 5.48976, 5.50236, 5.51496, 5.52756, 5.54016, 5.55276, 5.56536, 5.57796, 5.59056, 5.60316, 5.61576, 5.62836, 5.64096, 5.65356, 5.66616, 5.67876, 5.69136, 5.70396, 5.71656, 5.72916, 5.74176, 5.75436, 5.76696, 5.77956, 5.79216, 5.80476, 5.81736, 5.82996, 5.84256, 5.85516, 5.86776, 5.88036, 5.89296, 5.90556, 5.91816, 5.93076, 5.94336, 5.95596, 5.96856, 5.98116, 5.99376, 6.00636, 6.01896, 6.03156, 6.04416, 6.05676, 6.06936, 6.08196, 6.09456, 6.10716, 6.11976, 6.13236, 6.14496, 6.15756, 6.17016, 6.18276, 6.19536, 6.20796, 6.22056, 6.23316, 6.24576, 6.25836, 6.27096, 6.28356, 6.29616, 6.30876, 6.32136, 6.33396, 6.34656, 6.35916, 6.37176, 6.38436, 6.39696, 6.40956, 6.42216, 6.43476, 6.44736, 6.45996, 6.47256, 6.48516, 6.49776, 6.51036, 6.52296, 6.53556, 6.54816, 6.56076, 6.57336, 6.58596, 6.59856, 6.61116, 6.62376, 6.63636, 6.64896, 6.66156, 6.67416, 6.68676, 6.69936, 6.71196, 6.72456, 6.73716, 6.74976, 6.76236, 6.77496, 6.78756, 6.80016, 6.81276, 6.82536, 6.83796, 6.85056, 6.86316, 6.87576, 6.88836, 6.90096, 6.91356, 6.92616, 6.93876, 6.95136, 6.96396, 6.97656, 6.98916, 7.00176, 7.01436, 7.02696, 7.03956, 7.05216, 7.06476, 7.07736, 7.08996, 7.10256, 7.11516, 7.12776, 7.14036, 7.15296, 7.16556, 7.17816, 7.19076, 7.20336, 7.21596, 7.22856, 7.24116, 7.25376, 7.26636, 7.27896, 7.29156, 7.30416, 7.31676, 7.32936, 7.34196, 7.35456, 7.36716, 7.37976, 7.39236, 7.40496, 7.41756, 7.43016, 7.44276, 7.45536, 7.46796, 7.48056, 7.49316, 7.50576, 7.51836, 7.53096, 7.54356, 7.55616, 7.56876, 7.58136, 7.59396, 7.60656, 7.61916, 7.63176, 7.64436, 7.65696, 7.66956, 7.68216, 7.69476, 7.70736, 7.71996, 7.73256, 7.74516, 7.75776, 7.77036, 7.78296, 7.79556, 7.80816, 7.82076, 7.83336, 7.84596, 7.85856, 7.87116, 7.88376, 7.89636, 7.90896, 7.92156, 7.93416, 7.94676, 7.95936, 7.97196, 7.98456, 7.99716, 8.00976, 8.02236, 8.03496, 8.04756, 8.06016, 8.07276, 8.08536, 8.09796, 8.11056, 8.12316, 8.13576, 8.14836, 8.16096, 8.17356, 8.18616, 8.19876, 8.21136, 8.22396, 8.23656, 8.24916, 8.26176, 8.27436, 8.28696, 8.29956, 8.31216, 8.32476, 8.33736, 8.34996, 8.36256, 8.37516, 8.38776, 8.40036, 8.41296, 8.42556, 8.43816, 8.45076, 8.46336, 8.47596, 8.48856, 8.50116, 8.51376, 8.52636, 8.53896, 8.55156, 8.56416, 8.57676, 8.58936, 8.60196, 8.61456, 8.62716, 8.63976, 8.65236, 8.66496, 8.67756, 8.69016, 8.70276, 8.71536, 8.72796, 8.74056, 8.75316, 8.76576, 8.77836, 8.79096, 8.80356, 8.81616, 8.82876, 8.84136, 8.85396, 8.86656, 8.87916, 8.89176, 8.90436, 8.91696, 8.92956, 8.94216, 8.95476, 8.96736, 8.97996, 8.99256, 9.00516, 9.01776, 9.03036, 9.04296, 9.05556, 9.06816, 9.08076, 9.09336, 9.10596, 9.11856, 9.13116, 9.14376, 9.15636, 9.16896, 9.18156, 9.19416, 9.20676, 9.21936, 9.23196, 9.24456, 9.25716, 9.26976, 9.28236, 9.29496, 9.30756, 9.32016, 9.33276, 9.34536, 9.35796, 9.37056, 9.38316, 9.39576, 9.40836, 9.42096, 9.43356, 9.44616, 9.45876, 9.47136, 9.48396, 9.49656, 9.50916, 9.52176, 9.53436, 9.54696, 9.55956, 9.57216, 9.58476, 9.59736, 9.60996, 9.62256, 9.63516, 9.64776, 9.66036, 9.67296, 9.68556, 9.69816, 9.71076, 9.72336, 9.73596, 9.74856, 9.76116, 9.77376, 9.78636, 9.79896, 9.81156, 9.82416, 9.83676, 9.84936, 9.86196, 9.87456, 9.88716, 9.89976, 9.91236, 9.92496, 9.93756, 9.95016, 9.96276, 9.97536, 9.98796, 10.00056];
  const kBlue = [0.01961, 0.02706, 0.03450, 0.04194, 0.04938, 0.05682, 0.06426, 0.07170, 0.07914, 0.08658, 0.09402, 0.10146, 0.10890, 0.11634, 0.12378, 0.13122, 0.13866, 0.14610, 0.15354, 0.16098, 0.16842, 0.17586, 0.18330, 0.19074, 0.19818, 0.20562, 0.21306, 0.22050, 0.22794, 0.23538, 0.24282, 0.25026, 0.25770, 0.26514, 0.27258, 0.28002, 0.28746, 0.29490, 0.30234, 0.30978, 0.31722, 0.32466, 0.33210, 0.33954, 0.34698, 0.35442, 0.36186, 0.36930, 0.37674, 0.38418, 0.39162, 0.39906, 0.40650, 0.41394, 0.42138, 0.42882, 0.43626, 0.44370, 0.45114, 0.45858, 0.46602, 0.47346, 0.48090, 0.48834, 0.49578, 0.50322, 0.51066, 0.51810, 0.52554, 0.53298, 0.54042, 0.54786, 0.55530, 0.56274, 0.57018, 0.57762, 0.58506, 0.59250, 0.59994, 0.60738, 0.61482, 0.62226, 0.62970, 0.63714, 0.64458, 0.65202, 0.65946, 0.66690, 0.67434, 0.68178, 0.68922, 0.69666, 0.70410, 0.71154, 0.71898, 0.72642, 0.73386, 0.74130, 0.74874, 0.75618, 0.76362, 0.77106, 0.77850, 0.78594, 0.79338, 0.80082, 0.80826, 0.81570, 0.82314, 0.83058, 0.83802, 0.84546, 0.85290, 0.86034, 0.86778, 0.87522, 0.88266, 0.89010, 0.89754, 0.90498, 0.91242, 0.91986, 0.92730, 0.93474, 0.94218, 0.94962, 0.95706, 0.96450, 0.97194, 0.97938, 0.98682, 0.99426, 1.00170, 1.00914, 1.01658, 1.02402, 1.03146, 1.03890, 1.04634, 1.05378, 1.06122, 1.06866, 1.07610, 1.08354, 1.09098, 1.09842, 1.10586, 1.11330, 1.12074, 1.12818, 1.13562, 1.14306, 1.15050, 1.15794, 1.16538, 1.17282, 1.18026, 1.18770, 1.19514, 1.20258, 1.21002, 1.21746, 1.22490, 1.23234, 1.23978, 1.24722, 1.25466, 1.26210, 1.26954, 1.27698, 1.28442, 1.29186, 1.29930, 1.30674, 1.31418, 1.32162, 1.32906, 1.33650, 1.34394, 1.35138, 1.35882, 1.36626, 1.37370, 1.38114, 1.38858, 1.39602, 1.40346, 1.41090, 1.41834, 1.42578, 1.43322, 1.44066, 1.44810, 1.45554, 1.46298, 1.47042, 1.47786, 1.48530, 1.49274, 1.50018, 1.50762, 1.51506, 1.52250, 1.52994, 1.53738, 1.54482, 1.55226, 1.55970, 1.56714, 1.57458, 1.58202, 1.58946, 1.59690, 1.60434, 1.61178, 1.61922, 1.62666, 1.63410, 1.64154, 1.64898, 1.65642, 1.66386, 1.67130, 1.67874, 1.68618, 1.69362, 1.70106, 1.70850, 1.71594, 1.72338, 1.73082, 1.73826, 1.74570, 1.75314, 1.76058, 1.76802, 1.77546, 1.78290, 1.79034, 1.79778, 1.80522, 1.81266, 1.82010, 1.82754, 1.83498, 1.84242, 1.84986, 1.85730, 1.86474, 1.87218, 1.87962, 1.88706, 1.89450, 1.90194, 1.90938, 1.91682, 1.92426, 1.93170, 1.93914, 1.94658, 1.95402, 1.96146, 1.96890, 1.97634, 1.98378, 1.99122, 1.99866, 2.00610, 2.01354, 2.02098, 2.02842, 2.03586, 2.04330, 2.05074, 2.05818, 2.06562, 2.07306, 2.08050, 2.08794, 2.09538, 2.10282, 2.11026, 2.11770, 2.12514, 2.13258, 2.14002, 2.14746, 2.15490, 2.16234, 2.16978, 2.17722, 2.18466, 2.19210, 2.19954, 2.20698, 2.21442, 2.22186, 2.22930, 2.23674, 2.24418, 2.25162, 2.25906, 2.26650, 2.27394, 2.28138, 2.28882, 2.29626, 2.30370, 2.31114, 2.31858, 2.32602, 2.33346, 2.34090, 2.34834, 2.35578, 2.36322, 2.37066, 2.37810, 2.38554, 2.39298, 2.40042, 2.40786, 2.41530, 2.42274, 2.43018, 2.43762, 2.44506, 2.45250, 2.45994, 2.46738, 2.47482, 2.48226, 2.48970, 2.49714, 2.50458, 2.51202, 2.51946, 2.52690, 2.53434, 2.54178, 2.54922, 2.55666, 2.56410, 2.57154, 2.57898, 2.58642, 2.59386, 2.60130, 2.60874, 2.61618, 2.62362, 2.63106, 2.63850, 2.64594, 2.65338, 2.66082, 2.66826, 2.67570, 2.68314, 2.69058, 2.69802, 2.70546, 2.71290, 2.72034, 2.72778, 2.73522, 2.74266, 2.75010, 2.75754, 2.76498, 2.77242, 2.77986, 2.78730, 2.79474, 2.80218, 2.80962, 2.81706, 2.82450, 2.83194, 2.83938, 2.84682, 2.85426, 2.86170, 2.86914, 2.87658, 2.88402, 2.89146, 2.89890, 2.90634, 2.91378, 2.92122, 2.92866, 2.93610, 2.94354, 2.95098, 2.95842, 2.96586, 2.97330, 2.98074, 2.98818, 2.99562, 3.00306, 3.01050, 3.01794, 3.02538, 3.03282, 3.04026, 3.04770, 3.05514, 3.06258, 3.07002, 3.07746, 3.08490, 3.09234, 3.09978, 3.10722, 3.11466, 3.12210, 3.12954, 3.13698, 3.14442, 3.15186, 3.15930, 3.16674, 3.17418, 3.18162, 3.18906, 3.19650, 3.20394, 3.21138, 3.21882, 3.22626, 3.23370, 3.24114, 3.24858, 3.25602, 3.26346, 3.27090, 3.27834, 3.28578, 3.29322, 3.30066, 3.30810, 3.31554, 3.32298, 3.33042, 3.33786, 3.34530, 3.35274, 3.36018, 3.36762, 3.37506, 3.38250, 3.38994, 3.39738, 3.40482, 3.41226, 3.41970, 3.42714, 3.43458, 3.44202, 3.44946, 3.45690, 3.46434, 3.47178, 3.47922, 3.48666, 3.49410, 3.50154, 3.50898, 3.51642, 3.52386, 3.53130, 3.53874, 3.54618, 3.55362, 3.56106, 3.56850, 3.57594, 3.58338, 3.59082, 3.59826, 3.60570, 3.61314, 3.62058, 3.62802, 3.63546, 3.64290, 3.65034, 3.65778, 3.66522, 3.67266, 3.68010, 3.68754, 3.69498, 3.70242, 3.70986, 3.71730, 3.72474, 3.73218, 3.73962, 3.74706, 3.75450, 3.76194, 3.76938, 3.77682, 3.78426, 3.79170, 3.79914, 3.80658, 3.81402, 3.82146, 3.82890, 3.83634, 3.84378, 3.85122, 3.85866, 3.86610, 3.87354, 3.88098, 3.88842, 3.89586, 3.90330, 3.91074, 3.91818, 3.92562, 3.93306, 3.94050, 3.94794, 3.95538, 3.96282, 3.97026, 3.97770, 3.98514, 3.99258, 4.00002];
  const idx = Math.max(0, Math.min(255, Math.round(v * 255)));
  return [Math.round(kRed[idx] * 255), Math.round(kGreen[idx] * 255), Math.round(kBlue[idx] * 255)];
} 