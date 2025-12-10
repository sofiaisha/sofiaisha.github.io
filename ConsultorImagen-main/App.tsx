import React, { useState } from 'react';
import { AppStep, UserProfile, ImageFile } from './types';
import { Button } from './components/Button';
import { PhotoUploader } from './components/PhotoUploader';
import { analyzeProfile } from './services/geminiService';

const FadeIn: React.FC<{ children: React.ReactNode, delay?: number }> = ({ children, delay = 0 }) => (
  <div className={`animate-fade-in print:!opacity-100 print:!animate-none`} style={{ animation: `fadeIn 0.8s ease-out ${delay}s forwards`, opacity: 0 }}>
    {children}
  </div>
);

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.ONBOARDING);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gender: '',
    height: '',
    weight: '',
    bodyType: '',
    role: '',
    restrictions: ''
  });
  
  const [images, setImages] = useState<ImageFile[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAnalysis = async () => {
    if (images.length === 0) {
      alert("Por favor sube al menos una foto.");
      return;
    }
    
    setStep(AppStep.ANALYZING);
    setLoading(true);
    
    try {
      const responseText = await analyzeProfile(profile, images);
      setResult(responseText);
      setStep(AppStep.RESULTS);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al procesar tu análisis. Por favor intenta de nuevo.");
      setStep(AppStep.PHOTO_UPLOAD);
    } finally {
      setLoading(false);
    }
  };

  // 1. DOWNLOAD AS HTML (Fail-safe)
  const handleDownloadHTML = () => {
    if (!result) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte Estándares de Imagen - ${profile.name}</title>
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; background-color: #f9f9f9; }
          .container { background: white; padding: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          h1 { color: #1a1a1a; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; }
          h2 { color: #1a1a1a; margin-top: 30px; font-size: 24px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          strong { color: #d4af37; }
          ul { padding-left: 20px; }
          li { margin-bottom: 10px; }
          .meta { text-align: center; color: #888; font-style: italic; margin-bottom: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${profile.name}</h1>
          <p class="meta">Estrategia para: ${profile.role}</p>
          ${result.replace(/\n/g, '<br/>').replace(/## (.*?)<br\/>/g, '<h2>$1</h2>').replace(/- \*\*(.*?)\*\*/g, '<li><strong>$1</strong>').replace(/- /g, '<li>')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Estándares_Imagen_Argentina_Integrada_${profile.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. DOWNLOAD AS DOC
  const handleDownloadDoc = () => {
    if (!result) return;
    
    // Create a Word-compatible HTML structure
    const contentBody = result
      .replace(/\n/g, '<br/>')
      .replace(/## (.*?)<br\/>/g, '<h2>$1</h2>')
      .replace(/- \*\*(.*?)\*\*/g, '<li><strong>$1</strong>')
      .replace(/- /g, '<li>');

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Reporte Estándares de Imagen - ${profile.name}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; }
          h1 { color: #1a1a1a; font-size: 24pt; text-align: center; margin-bottom: 24pt; }
          h2 { color: #1a1a1a; font-size: 16pt; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1px solid #d4af37; padding-bottom: 3pt; }
          strong { color: #d4af37; font-weight: bold; }
          ul { margin-bottom: 12pt; }
          li { margin-bottom: 3pt; }
          p { margin-bottom: 12pt; }
          .meta { text-align: center; color: #666; margin-bottom: 24pt; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>${profile.name}</h1>
        <p class="meta">Objetivo: ${profile.role}</p>
        <hr/>
        ${contentBody}
      </body>
      </html>
    `;

    // Use application/msword and a .doc extension
    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Estándares_Imagen_Argentina_Integrada_${profile.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. COPY TO CLIPBOARD
  const handleCopyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      alert("¡Reporte copiado! Ahora puedes pegarlo en un correo o documento.");
    });
  };

  // --- RENDERING SUB-COMPONENTS ---

  const renderOnboarding = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-3xl mx-auto px-6">
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl text-primary mb-6 leading-tight">Estándares de imagen de Argentina Integrada</h1>
      </FadeIn>
      <FadeIn delay={0.2}>
        <p className="text-xl text-secondary font-light mb-10 leading-relaxed">
          Eleva tu presencia e influencia pública con una imagen alineada a tu perfil dentro de la organización.<br/>
          Consultoría de Imagen Ejecutiva impulsada por Inteligencia Artificial.
        </p>
      </FadeIn>
      <FadeIn delay={0.4}>
        <Button onClick={() => setStep(AppStep.PROFILE_INPUT)} className="text-lg px-10 py-4 uppercase tracking-widest">
          Iniciar Consultoría
        </Button>
      </FadeIn>
    </div>
  );

  const renderProfileInput = () => (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="mb-8 border-b pb-4">
         <h2 className="font-serif text-3xl text-primary">Perfil Biométrico y Estratégico</h2>
         <p className="text-sm text-gray-500 mt-2">Cuéntanos sobre tus atributos físicos y objetivos profesionales.</p>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Nombre Completo</label>
          <input 
            name="name"
            value={profile.name}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none py-2 text-lg text-primary placeholder-gray-400"
            placeholder="María Pérez"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Género</label>
            <select 
              name="gender" 
              value={profile.gender} 
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none py-2 text-primary"
            >
              <option value="">Seleccionar...</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="No binario">No binario</option>
              <option value="Prefiero no decir">Prefiero no decir</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Altura (cm/m)</label>
            <input 
              name="height"
              value={profile.height}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none py-2 text-primary placeholder-gray-400"
              placeholder="ej. 1.70m"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Peso (Kg)</label>
            <input 
              name="weight"
              value={profile.weight}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none py-2 text-primary placeholder-gray-400"
              placeholder="ej. Atlética/o"
            />
          </div>
        </div>

        <div>
           <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Tipo de Cuerpo</label>
           <select 
              name="bodyType" 
              value={profile.bodyType} 
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none py-2 text-primary"
            >
              <option value="">Seleccionar forma...</option>
              <optgroup label="Morfología Femenina">
                <option value="Reloj de Arena">Reloj de Arena (Hourglass)</option>
                <option value="Triángulo">Triángulo (Pera - Caderas anchas)</option>
                <option value="Triángulo Invertido">Triángulo Invertido (Espalda ancha)</option>
                <option value="Rectángulo">Rectángulo (Columna)</option>
                <option value="Oval">Oval (Manzana)</option>
              </optgroup>
              <optgroup label="Morfología Masculina">
                <option value="Trapezoide">Trapezoide (Equilibrado/Atlético)</option>
                <option value="Triángulo Invertido V">Triángulo Invertido (Forma de V)</option>
                <option value="Rectángulo M">Rectángulo (Delgado/Recto)</option>
                <option value="Triángulo M">Triángulo (Caderas más anchas que hombros)</option>
                <option value="Oval M">Oval (Robusto/Zona media prominente)</option>
              </optgroup>
              <option value="No estoy seguro/a">No estoy seguro/a</option>
           </select>
        </div>

        <div className="pt-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Arquetipo / Objetivo de Rol</label>
          <input 
            name="role"
            value={profile.role}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-gray-300 focus:border-primary focus:outline-none py-2 text-lg text-primary placeholder-gray-400"
            placeholder="ej. CEO Tecnológica, Política, Directora Creativa"
          />
        </div>

        <div className="pt-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 text-primary">Restricciones / Condiciones</label>
          <textarea 
            name="restrictions"
            value={profile.restrictions}
            onChange={handleInputChange}
            className="w-full bg-white border border-gray-200 p-3 mt-2 focus:border-primary focus:outline-none rounded-sm text-sm text-primary placeholder-gray-400"
            rows={3}
            placeholder="ej. No puedo usar tacones, alergia al oro, clima tropical, presupuesto limitado."
          />
        </div>

        <div className="pt-8 flex justify-end">
          <Button onClick={() => setStep(AppStep.PHOTO_UPLOAD)} disabled={!profile.name || !profile.role || !profile.gender}>
            Siguiente Paso &rarr;
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPhotoUpload = () => (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="mb-8 border-b pb-4 flex justify-between items-end">
         <div>
            <h2 className="font-serif text-3xl text-primary">Evaluación Visual</h2>
            <p className="text-sm text-gray-500 mt-2">Sube 1-3 fotos para el análisis biométrico.</p>
         </div>
         <button onClick={() => setStep(AppStep.PROFILE_INPUT)} className="text-xs text-gray-400 hover:text-primary underline">Volver</button>
      </div>

      <PhotoUploader images={images} setImages={setImages} />

      <div className="mt-10">
        <Button onClick={handleAnalysis} fullWidth disabled={images.length === 0}>
          Generar Estrategia de Imagen
        </Button>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto px-6 text-center">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-accent rounded-full animate-spin mb-8"></div>
      <h3 className="font-serif text-2xl text-primary mb-2">Analizando Morfología y Semiótica...</h3>
      <p className="text-gray-500 font-light">
        Nuestros expertos están revisando tu perfil contra tu arquetipo deseado: <span className="font-semibold text-primary">{profile.role}</span>.
      </p>
      <div className="mt-8 space-y-2 text-xs text-gray-400 font-mono">
        <p className="animate-pulse">Procesando datos biométricos...</p>
        <p className="animate-pulse" style={{ animationDelay: '1s' }}>Evaluando armonía de color...</p>
        <p className="animate-pulse" style={{ animationDelay: '2s' }}>Construyendo estrategia de guardarropa...</p>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    // Simple markdown parser for headers and lists
    const formattedResult = result.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h2 key={index} className="font-serif text-3xl text-primary mt-12 mb-6 border-b border-gray-200 pb-2 break-inside-avoid print:text-black">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('- **')) {
        const parts = line.split('**');
        return (
          <li key={index} className="mb-3 text-secondary leading-relaxed list-none print:text-black">
            <span className="font-bold text-primary print:text-black">{parts[1]}</span> {parts[2]}
          </li>
        );
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="mb-2 text-secondary ml-4 print:text-black">{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>;
      }
      return <p key={index} className="mb-4 text-secondary leading-relaxed print:text-black">{line}</p>;
    });

    return (
      <div className="max-w-4xl mx-auto py-12 px-6 print:p-0 print:max-w-none print:w-full">
        {/* Printable Content Wrapper */}
        <div id="results-content" className="bg-white p-8 md:p-12 shadow-sm rounded-sm print:shadow-none print:p-0 print:bg-transparent">
          <div className="text-center mb-16 print:mb-8">
            <p className="uppercase tracking-widest text-xs text-gray-400 mb-2 print:text-black">Reporte de Consultoría Privada</p>
            <h1 className="font-serif text-5xl text-primary mb-4 print:text-black">{profile.name}</h1>
            <p className="font-serif text-xl text-accent italic print:text-black">Objetivo: {profile.role}</p>
          </div>

          <div className="text-left">
            {formattedResult}
          </div>

           <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400 print:block hidden">
             <p>Generado por Estándares de imagen de Argentina Integrada IA</p>
           </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200 print:hidden">
          <h4 className="text-center font-serif text-lg mb-4 text-primary">Guarda tu Estrategia</h4>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            
            {/* Option 1: DOC */}
            <Button 
              variant="secondary" 
              onClick={handleDownloadDoc}
              className="w-full md:w-auto"
              title="Descargar como archivo de Word"
            >
              📄 Guardar como Word
            </Button>

            {/* Option 2: HTML (Fail-safe) */}
            <Button 
              variant="outline" 
              onClick={handleDownloadHTML}
              className="w-full md:w-auto"
              title="Descargar como archivo web"
            >
              🌐 Guardar como HTML
            </Button>

            {/* Option 3: Copy */}
            <Button 
              variant="outline" 
              onClick={handleCopyText}
              className="w-full md:w-auto"
            >
              📋 Copiar Texto
            </Button>
          </div>
          <div className="text-center mt-6">
              <button 
                onClick={() => {
                  setStep(AppStep.ONBOARDING);
                  setImages([]);
                  setResult(null);
                  setProfile({ name: '', gender: '', height: '', weight: '', bodyType: '', role: '', restrictions: '' });
                }}
                className="text-xs text-gray-400 hover:text-red-500 underline"
              >
                Iniciar Nueva Consultoría
              </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream font-sans selection:bg-accent selection:text-white print:bg-white print:min-h-0 print:h-auto">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media print {
          @page { margin: 1.5cm; }
          body, html, #root { 
            height: auto !important; 
            overflow: visible !important; 
            background-color: white !important;
          }
          /* NUCLEAR OPTION: Force all elements to be visible and black for printing */
          * {
            opacity: 1 !important;
            visibility: visible !important;
            animation: none !important;
            transition: none !important;
            color: black !important; /* Force black text for maximum readability */
          }
          /* Hide non-printable elements */
          nav, button, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Header/Nav */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-multiply print:hidden">
        <div className="font-serif font-bold text-lg tracking-wider text-primary cursor-pointer uppercase" onClick={() => step !== AppStep.ANALYZING && setStep(AppStep.ONBOARDING)}>
          ARGENTINA INTEGRADA
        </div>
        <div className="text-xs font-bold tracking-widest text-primary">
          {step === AppStep.ONBOARDING ? '' : 'BETA v1.0'}
        </div>
      </nav>

      <main className="pt-20 pb-20 print:pt-0 print:pb-0 print:h-auto">
        {step === AppStep.ONBOARDING && renderOnboarding()}
        {step === AppStep.PROFILE_INPUT && renderProfileInput()}
        {step === AppStep.PHOTO_UPLOAD && renderPhotoUpload()}
        {step === AppStep.ANALYZING && renderAnalyzing()}
        {step === AppStep.RESULTS && renderResults()}
      </main>
    </div>
  );
};

export default App;