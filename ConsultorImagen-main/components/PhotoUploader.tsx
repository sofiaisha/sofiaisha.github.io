import React, { useRef } from 'react';
import { ImageFile } from '../types';
import { Button } from './Button';

interface PhotoUploaderProps {
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ images, setImages }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray: File[] = Array.from(e.target.files);
      
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [
            ...prev,
            {
              file,
              previewUrl: URL.createObjectURL(file),
              base64: reader.result as string
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div 
        className="border-2 border-dashed border-gray-300 bg-white p-10 text-center rounded-lg hover:border-accent transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div className="text-4xl mb-3 text-gray-400">📷</div>
        <p className="font-serif text-xl text-primary mb-2">Sube tus Fotos Actuales</p>
        <p className="text-gray-500 text-sm">Preferiblemente cuerpo completo y rostro. Buena iluminación y contraste.</p>
        <div className="mt-4">
          <span className="text-accent border-b border-accent uppercase text-xs tracking-widest font-bold">Seleccionar Archivos</span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-[3/4] overflow-hidden rounded-md shadow-sm">
              <img 
                src={img.previewUrl} 
                alt="Vista previa" 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};