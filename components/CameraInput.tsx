import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface CameraInputProps {
  onImageSelected: (base64: string) => void;
  isProcessing: boolean;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImageSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    event.target.value = '';

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      if (base64Data) {
        onImageSelected(base64Data);
      }
    };
    reader.readAsDataURL(file);
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