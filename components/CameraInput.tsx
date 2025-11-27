
import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface CameraInputProps {
  onImageSelected: (base64: string) => void;
  isProcessing: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImageSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize logic: Max dimension 1024px
        const MAX_SIZE = 1024;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height *= MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width *= MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          onImageSelected(dataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    event.target.value = '';
    
    processImage(file);
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment" // Attempts to launch rear camera on mobile
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      <button
        onClick={triggerCamera}
        disabled={isProcessing}
        className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        aria-label="Take food photo"
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <Camera className="w-8 h-8" />
        )}
      </button>
    </>
  );
};

export default CameraInput;
