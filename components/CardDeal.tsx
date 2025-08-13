"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import xraySample from "@/public/assets/pnevmonia.jpg";
import xrayBefore from "@/public/assets/xraybefore.png";
import xrayAfter from "@/public/assets/xrayafter.png";
import { getImageProcessor, ImageCorrectionResult } from "@/utils/imageProcessing";

const CLASS_NAMES = [
  "Atelectasis","Cardiomegaly","Effusion","Infiltration","Mass","Nodule",
  "Pneumonia","Pneumothorax","Consolidation","Edema","Emphysema","Fibrosis",
  "Pleural_Thickening","Hernia"
];

interface Prediction {
  label: string;
  confidence: number;
  classIndex: number;
}

interface AnalysisResults {
  predictions: Prediction[];
  heatmapUrl: string;
  boxes: Array<{x: number, y: number, w: number, h: number, label: string}>;
  reportText?: string;
  summary?: string;
  recommendations?: string[];
  primaryDiagnosis?: string;
  confidence?: number;
}

interface ProcessingStep {
  step: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 70) return "text-green-400";
  if (confidence >= 40) return "text-yellow-400";
  return "text-red-400";
};

const DIAGNOSIS_INFO: Record<string, { description: string; symptoms: string; recommendations: string }> = {
  "Atelectasis": {
    description: "Atelectasis is the collapse or closure of a lung resulting in reduced or absent gas exchange. It may affect part or all of one lung.",
    symptoms: "Shortness of breath, rapid breathing, cough, and low oxygen saturation.",
    recommendations: "Consult a pulmonologist for further evaluation. Additional imaging or bronchoscopy may be required to determine the cause and guide treatment.",
  },
  "Cardiomegaly": {
    description: "Cardiomegaly refers to an enlarged heart, which can be a sign of various underlying conditions such as hypertension or heart valve disease.",
    symptoms: "Fatigue, shortness of breath, swelling of the legs, and palpitations.",
    recommendations: "Seek a cardiology consultation. Echocardiography and further cardiac workup are recommended to identify the underlying cause.",
  },
  "Effusion": {
    description: "Pleural effusion is the accumulation of excess fluid between the layers of the pleura outside the lungs.",
    symptoms: "Chest pain, cough, and difficulty breathing.",
    recommendations: "Medical evaluation is necessary. Thoracic ultrasound or CT and fluid analysis may be indicated to determine the cause.",
  },
  "Infiltration": {
    description: "Pulmonary infiltration refers to the filling of airspaces with fluid, cells, or other material, often due to infection or inflammation.",
    symptoms: "Cough, fever, chest discomfort, and shortness of breath.",
    recommendations: "Consult a physician for further assessment. Additional imaging and laboratory tests may be required.",
  },
  "Mass": {
    description: "A lung mass is an abnormal growth in the lung, which may be benign or malignant.",
    symptoms: "May be asymptomatic or present with cough, hemoptysis, or chest pain.",
    recommendations: "Referral to a pulmonologist or oncologist is advised. Further imaging and possibly biopsy are recommended.",
  },
  "Nodule": {
    description: "A pulmonary nodule is a small, round growth in the lung, often found incidentally on imaging.",
    symptoms: "Usually asymptomatic.",
    recommendations: "Follow-up with a pulmonologist for risk assessment and possible serial imaging to monitor for changes.",
  },
  "Pneumonia": {
    description: "Pneumonia is an infection that inflames the air sacs in one or both lungs, which may fill with fluid.",
    symptoms: "Cough, fever, chills, chest pain, and difficulty breathing.",
    recommendations: "Seek medical attention for diagnosis and treatment. Antibiotics or antivirals may be required depending on the cause.",
  },
  "Pneumothorax": {
    description: "Pneumothorax is the presence of air in the pleural space, causing lung collapse.",
    symptoms: "Sudden chest pain, shortness of breath, and rapid heart rate.",
    recommendations: "This is a medical emergency. Immediate evaluation in an emergency department is required.",
  },
  "Consolidation": {
    description: "Consolidation refers to the region of lung tissue filled with liquid instead of air, commonly due to pneumonia.",
    symptoms: "Cough, fever, and shortness of breath.",
    recommendations: "Consult a healthcare provider for further evaluation and management.",
  },
  "Edema": {
    description: "Pulmonary edema is fluid accumulation in the tissue and air spaces of the lungs, often due to heart failure.",
    symptoms: "Severe shortness of breath, cough with frothy sputum, and rapid breathing.",
    recommendations: "Seek urgent medical care. Treatment of the underlying cause is essential.",
  },
  "Emphysema": {
    description: "Emphysema is a chronic lung condition involving damage to the alveoli, leading to breathing difficulties.",
    symptoms: "Progressive shortness of breath, chronic cough, and reduced exercise tolerance.",
    recommendations: "Consult a pulmonologist. Smoking cessation and inhaled therapies may help slow progression.",
  },
  "Fibrosis": {
    description: "Pulmonary fibrosis is the formation of excess fibrous connective tissue in the lungs, leading to scarring.",
    symptoms: "Chronic dry cough, shortness of breath, and fatigue.",
    recommendations: "Consult a pulmonologist for diagnosis and management. Further tests may be required to determine the cause.",
  },
  "Pleural_Thickening": {
    description: "Pleural thickening is the thickening of the lining of the lungs, which can result from infection, inflammation, or exposure to irritants.",
    symptoms: "Often asymptomatic, but may cause chest discomfort or reduced lung function.",
    recommendations: "Medical evaluation is recommended. Further imaging may be necessary to determine the cause.",
  },
  "Hernia": {
    description: "A diaphragmatic hernia is a defect or hole in the diaphragm that allows abdominal contents to move into the chest cavity.",
    symptoms: "Heartburn, chest pain, and discomfort after eating.",
    recommendations: "Consult a gastroenterologist for further evaluation and management.",
  },
};

//const BACKEND_URL = "https://pneumonia-backend-ai-a83d23c06fe9.herokuapp.com/predict"; // Heroku backend URL
const HEATMAP_URL = "http://127.0.0.1:8000/heatmap";
const BOXES_URL = "http://127.0.0.1:8000/boxes";

  const isLikelyChestXray = async (file: File): Promise<boolean> => {
    try {
      const imageProcessor = getImageProcessor();
      return await imageProcessor.isChestXray(file);
    } catch (error) {
      console.error('Error checking if image is chest X-ray:', error);
      return false;
    }
  };

const CardDeal: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<Prediction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [infoOpenIdx, setInfoOpenIdx] = useState<number | null>(null);
  const [backendHeatmaps, setBackendHeatmaps] = useState<string[] | null>(null);
  const [backendReport, setBackendReport] = useState<string | null>(null);
  const [selectedHeatmapIdx, setSelectedHeatmapIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [boxes, setBoxes] = useState<Array<{x: number, y: number, w: number, h: number, label: string}>>([]);
  const [showBoxes, setShowBoxes] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [imageCorrection, setImageCorrection] = useState<ImageCorrectionResult | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [showReport, setShowReport] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setImageCorrection(null);
      setShowCorrected(false);
      setAnalysisResults(null);
      setProcessingSteps([]);
      setOverallProgress(0);
    }
  };

  const performFullAnalysis = async (file: File) => {
    // Инициализируем шаги обработки
    const steps: ProcessingStep[] = [
      { step: "Validating image...", progress: 0, status: 'pending' },
      { step: "Enhancing image quality...", progress: 0, status: 'pending' },
      { step: "Running AI analysis...", progress: 0, status: 'pending' },
      { step: "Generating heatmap...", progress: 0, status: 'pending' },
      { step: "Detecting areas of interest...", progress: 0, status: 'pending' },
      { step: "Finalizing results...", progress: 0, status: 'pending' }
    ];
    
    setProcessingSteps(steps);
    setOverallProgress(0);
    setLoading(true);
    
    try {
      // Шаг 1: Валидация изображения (5%)
      steps[0].status = 'processing';
      steps[0].progress = 50;
      setProcessingSteps([...steps]);
      setOverallProgress(5);
      
      const isChest = await isLikelyChestXray(file);
      if (!isChest) {
        setShowErrorNotification(true);
        setTimeout(() => setShowErrorNotification(false), 4000);
        return;
      }
      
      steps[0].status = 'completed';
      steps[0].progress = 100;
      setProcessingSteps([...steps]);
      setOverallProgress(10);
      
      // Шаг 2: Улучшение изображения (15%)
      steps[1].status = 'processing';
      steps[1].progress = 50;
      setProcessingSteps([...steps]);
      setOverallProgress(15);
      
      const imageProcessor = getImageProcessor();
      const correction = await imageProcessor.processImage(file);
      setImageCorrection(correction);
      
      steps[1].status = 'completed';
      steps[1].progress = 100;
      setProcessingSteps([...steps]);
      setOverallProgress(25);
      
      // Шаг 3: AI анализ (30%)
      steps[2].status = 'processing';
      steps[2].progress = 30;
      setProcessingSteps([...steps]);
      setOverallProgress(35);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const predictRes = await fetch("https://octoaipus.onrender.com/predict", {
        method: "POST",
        body: formData,
      });
      const predictData = await predictRes.json();
      
      steps[2].progress = 70;
      setProcessingSteps([...steps]);
      setOverallProgress(45);
      
      // Шаг 4: Генерация heatmap (25%)
      steps[3].status = 'processing';
      steps[3].progress = 30;
      setProcessingSteps([...steps]);
      setOverallProgress(55);
      
      const heatmapRes = await fetch(HEATMAP_URL, {
        method: "POST",
        body: formData,
      });
      const heatmapBlob = await heatmapRes.blob();
      const heatmapUrl = URL.createObjectURL(heatmapBlob);
      
      steps[3].status = 'completed';
      steps[3].progress = 100;
      setProcessingSteps([...steps]);
      setOverallProgress(70);
      
      // Шаг 5: Детекция областей (20%)
      steps[4].status = 'processing';
      steps[4].progress = 50;
      setProcessingSteps([...steps]);
      setOverallProgress(80);
      
      const boxesRes = await fetch(BOXES_URL, {
        method: "POST",
        body: formData,
      });
      const boxesData = await boxesRes.json();
      
      steps[4].status = 'completed';
      steps[4].progress = 100;
      setProcessingSteps([...steps]);
      setOverallProgress(90);
      
      // Шаг 6: Финальная обработка (10%)
      steps[5].status = 'processing';
      steps[5].progress = 50;
      setProcessingSteps([...steps]);
      setOverallProgress(95);
      
      // Сохраняем все результаты
      const results: AnalysisResults = {
        predictions: predictData.predictions,
        heatmapUrl: heatmapUrl,
        boxes: boxesData.boxes || [],
        reportText: predictData.report_text,
        summary: predictData.summary,
        recommendations: predictData.recommendations,
        primaryDiagnosis: predictData.primary_diagnosis,
        confidence: predictData.confidence
      };
      
      setAnalysisResults(results);
      setResult(predictData.predictions);
      (window as any).lastReportText = predictData.report_text;
      
      steps[5].status = 'completed';
      steps[5].progress = 100;
      setProcessingSteps([...steps]);
      setOverallProgress(100);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      // Показываем ошибку в текущем шаге
      const currentStep = steps.findIndex(step => step.status === 'processing');
      if (currentStep !== -1) {
        steps[currentStep].status = 'error';
        setProcessingSteps([...steps]);
      }
      alert("Analysis failed: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowBackendHeatmap = () => {
    if (!image) {
      // Для примера изображения показываем heatmap
      setShowHeatmap(true);
      setShowBoxes(false);
      setPreview(typeof xrayAfter === 'string' ? xrayAfter : xrayAfter.src);
      return;
    }
    
    // Проверяем, если результат Normal, показываем уведомление
    if (mainResult && mainResult.label === 'NORMAL') {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
      return;
    }
    
    // Используем предзагруженный heatmap
    if (analysisResults) {
      setShowHeatmap(true);
      setShowBoxes(false);
      setPreview(analysisResults.heatmapUrl);
    }
  };

  const handleShowBoxes = () => {
    if (!image) {
      // Для примера изображения показываем оригинал
      setShowBoxes(false);
      setShowHeatmap(false);
      setPreview(typeof xrayBefore === 'string' ? xrayBefore : xrayBefore.src);
      return;
    }
    
    // Проверяем, если результат Normal, показываем уведомление
    if (mainResult && mainResult.label === 'NORMAL') {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
      return;
    }
    
    // Используем предзагруженные bounding boxes
    if (analysisResults) {
      setShowBoxes(true);
      setShowHeatmap(false);
      setBoxes(analysisResults.boxes);
    }
  };

  const handleShowOriginal = () => {
    setShowHeatmap(false);
    setShowBoxes(false);
    setPreview(image ? URL.createObjectURL(image) : null);
  };

  const handleSubmit = async () => {
    if (!image) return;
    await performFullAnalysis(image);
  };

  // Выбираем главный диагноз (с максимальной вероятностью)
  const mainResult = result ? result.reduce((max, curr) => curr.confidence > max.confidence ? curr : max, result[0]) : null;
  const normal = result?.find(r => r.label === 'NORMAL') || { confidence: 0 };
  const pneumonia = result?.find(r => r.label === 'PNEUMONIA') || { confidence: 0 };

  const isExample = !image;

  return (
    <section id="carddeal" className="relative overflow-hidden py-20">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-16">
          {/* LEFT: Upload & Predictions */}
          <div className="w-full max-w-lg flex flex-col items-center lg:items-start">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 text-center lg:text-left">
              Upload your chest scan
              <br className="sm:block hidden" />
              and get an <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">instant result</span>.
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 text-center lg:text-left">
              octoaipus provides an AI-based diagnosis of chest X-rays in just a few seconds.<br />
              Completely free, private, and accessible to everyone.
            </p>
            
            {/* Upload & Predict */}
            <div className="w-full flex flex-col sm:flex-row gap-3 items-center mb-8">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white font-semibold px-6 py-3 rounded-xl border border-cyan-500/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect width="20" height="12" x="2" y="8" rx="3" stroke="currentColor" strokeWidth="2"/></svg>
                {image ? image.name : "Choose File"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={handleSubmit}
                disabled={!image || loading}
                className={`bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white font-bold px-8 py-3 rounded-xl border border-blue-500/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 ${(!image || loading) ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>Analyzing...</span>
                ) : "Predict"}
              </button>
            </div>
            
            {/* Analysis Progress */}
            {loading && (
              <div className="w-full mb-8 p-6 bg-gradient-to-br from-slate-800/20 to-slate-900/20 border border-slate-700/20 rounded-2xl backdrop-blur-sm">
                {/* Overall Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-cyan-400">Analysis Progress</span>
                    <span className="text-sm font-mono text-cyan-300">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-3 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
                
                {/* Processing Steps */}
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                        )}
                        {step.status === 'processing' && (
                          <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                        )}
                        {step.status === 'completed' && (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {step.status === 'error' && (
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Step Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            step.status === 'completed' ? 'text-green-400' :
                            step.status === 'error' ? 'text-red-400' :
                            step.status === 'processing' ? 'text-cyan-400' :
                            'text-slate-400'
                          }`}>
                            {step.step}
                          </span>
                          {step.status === 'processing' && (
                            <span className="text-xs text-cyan-300 font-mono">{step.progress}%</span>
                          )}
                        </div>
                        
                        {/* Step Progress Bar */}
                        {step.status === 'processing' && (
                          <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${step.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Image Enhancement Toggle */}
            {imageCorrection && !processingImage && (
              <div className="w-full mb-6 p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">Auto-Enhanced</h4>
                      <p className="text-xs text-green-300">Optimized for analysis</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCorrected(!showCorrected)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                      showCorrected ? 'bg-green-500 shadow-lg shadow-green-500/25' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        showCorrected ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
            
            {/* Analysis Results */}
            {result && (
              <div className="w-full space-y-6">
                {/* Confidence Bar */}
                <div className="w-full p-6 bg-gradient-to-br from-slate-800/20 to-slate-900/20 border border-slate-700/20 rounded-2xl backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-green-300">Normal</span>
                    <span className="text-sm font-medium text-red-400">Pneumonia</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-3 transition-all duration-1000 ease-out"
                      style={{ width: `${normal.confidence}%` }}
                    />
                    <div
                      className="bg-gradient-to-r from-red-500 to-red-600 h-3 transition-all duration-1000 ease-out"
                      style={{ width: `${pneumonia.confidence}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-3">
                    <span className="text-xs text-green-200 font-mono">{normal.confidence.toFixed(1)}%</span>
                    <span className="text-xs text-red-300 font-mono">{pneumonia.confidence.toFixed(1)}%</span>
                  </div>
                </div>
                
                {/* Main Result */}
                {mainResult && (
                  <div className={`relative overflow-hidden rounded-2xl p-6 ${
                    mainResult.label === 'PNEUMONIA' 
                      ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30' 
                      : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                  } backdrop-blur-sm`}>
                    {/* Background glow */}
                    <div className={`absolute inset-0 rounded-2xl ${
                      mainResult.label === 'PNEUMONIA' 
                        ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10' 
                        : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
                    } blur-xl`} />
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          mainResult.label === 'PNEUMONIA' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          <span className="text-2xl">
                            {mainResult.label === 'PNEUMONIA' ? '⚠️' : '✅'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {mainResult.label === 'PNEUMONIA' ? 'Pneumonia Detected' : 'Normal Scan'}
                          </h3>
                          <p className="text-sm text-slate-300">
                            {mainResult.label === 'PNEUMONIA' ? 'Medical attention recommended' : 'No abnormalities found'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          {mainResult.confidence.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">Confidence</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Medical Report Section */}
                {analysisResults && (
                  <div className="w-full space-y-4">
                    {/* Report Toggle Button */}
                    <button
                      onClick={() => setShowReport(!showReport)}
                      className="w-full p-6 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl backdrop-blur-sm hover:from-purple-500/30 hover:to-indigo-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-white">Medical Report</h4>
                            <p className="text-sm text-purple-300">AI-generated detailed analysis</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-purple-300">
                            {showReport ? 'Hide' : 'View'}
                          </span>
                          <svg className={`w-5 h-5 text-purple-300 transition-transform duration-300 ${showReport ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    {/* Report Content */}
                    {showReport && (
                      <div className="space-y-4">
                        {/* Summary */}
                        {analysisResults.summary && (
                          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
                            <h5 className="font-semibold text-blue-300 mb-3">Summary</h5>
                            <p className="text-sm text-slate-200 leading-relaxed">{analysisResults.summary}</p>
                          </div>
                        )}
                        
                        {/* Recommendations */}
                        {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
                          <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
                            <h5 className="font-semibold text-green-300 mb-4">Recommendations</h5>
                            <ul className="space-y-3">
                              {analysisResults.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm text-slate-200">
                                  <span className="text-green-400 mt-1">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Full Report */}
                        {analysisResults.reportText && (
                          <div className="p-6 bg-gradient-to-br from-slate-800/20 to-slate-900/20 border border-slate-700/20 rounded-2xl backdrop-blur-sm">
                            <h5 className="font-semibold text-white mb-4">Detailed Report</h5>
                            <div className="bg-slate-900/50 rounded-xl p-4 max-h-60 overflow-y-auto">
                              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                                {analysisResults.reportText}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* RIGHT: X-ray/Heatmap */}
          <div className="w-full max-w-xl flex justify-center items-center mt-8 lg:mt-0 h-[400px]">
            <div className="relative w-full h-full max-w-[400px] aspect-square bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border border-slate-700/30 backdrop-blur-sm">
              <img
                src={
                  showHeatmap && !image ? (typeof xrayAfter === 'string' ? xrayAfter : xrayAfter.src)
                  : showCorrected && imageCorrection ? imageCorrection.correctedImage
                  : preview || (typeof xrayBefore === 'string' ? xrayBefore : xrayBefore.src)
                }
                alt="X-ray preview"
                className="w-full h-full object-cover rounded-2xl animate-fade-in"
                style={{ width: '100%', height: '100%' }}
              />
              {/* Bounding boxes */}
              {showBoxes && boxes.map((box, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${box.x / 224 * 100}%`,
                    top: `${box.y / 224 * 100}%`,
                    width: `${box.w / 224 * 100}%`,
                    height: `${box.h / 224 * 100}%`,
                    border: '2px solid #f59e42',
                    borderRadius: 4,
                    pointerEvents: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: -18,
                    left: 0,
                    background: '#f59e42',
                    color: '#fff',
                    fontSize: 12,
                    padding: '0 4px',
                    borderRadius: 3,
                  }}>{box.label}</span>
                </div>
              ))}
              {/* Кнопка для heatmap (левый нижний угол) */}
              <button
                onClick={handleShowBackendHeatmap}
                disabled={!!image && !result}
                className={`absolute bottom-3 left-3 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all z-10 ${
                  !!image && !result 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30'
                }`}
              >
                Show Heatmap
              </button>
              {/* Кнопка для bounding box (правый нижний угол) */}
              <button
                onClick={handleShowBoxes}
                disabled={!!image && !result}
                className={`absolute bottom-3 right-3 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all z-10 ${
                  !!image && !result 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30'
                }`}
              >
                Show Area
              </button>
              {(showHeatmap || showBoxes) && (
                <button
                  onClick={handleShowOriginal}
                  className="absolute top-3 right-3 bg-slate-800/50 text-white px-3 py-2 rounded-xl text-xs hover:bg-slate-700/50 transition-all border border-slate-600/30"
                >
                  Show Original
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Push Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-green-400 max-w-sm relative">
            <button
              onClick={() => setShowNotification(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="flex items-center gap-3 pr-6">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm">No abnormalities detected</h4>
                <p className="text-xs opacity-90 mt-1">Since the scan shows normal results, there are no areas of interest to highlight.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Notification */}
      {showErrorNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-red-400 max-w-sm relative">
            <button
              onClick={() => setShowErrorNotification(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="flex items-center gap-3 pr-6">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Invalid image type</h4>
                <p className="text-xs opacity-90 mt-1">Please upload a chest X-ray image. The uploaded file doesn't appear to be a chest X-ray.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CardDeal;
