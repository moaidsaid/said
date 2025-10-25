import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { Spinner } from './shared/Spinner';
import { Button } from './shared/Button';
import { Card } from './shared/Card';

type AspectRatio = '16:9' | '9:16';

// Extend window interface for aistudio
// FIX: Defined an AIStudio interface to resolve TypeScript error about subsequent property declarations.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

export const VideoGenerator: React.FC = () => {
  const initialPrompt = "أنت نخرج سينمائي متميز ولك تاريخ في انتاج الفيديوهات الدعائية لذلك أريد منك انتاج فيديو دعائي لورة ذكاء صناعي تقام في مدارس malm alsafwaa بحيث تحث الطلاب عن الصورة الجذابة والمثيرة للإشتراك في تلك الدورة وتظهر في المشاهد الجوانب الإيجابين لتعلم طلاب المراحل الأولية الابتدائي والثانوي أهمية الذكاء الصناعي وتظهر طالبات وطلاب يتفاعلون أمام اللاب توب في التطبيقات بشرط أن لاتكتب على الصور باللغة العربية تكون النصوص والشعارات بالإنجليزية وعمل مومشاهد صامتة بدون موسيقى أو صوت خذ نفس عميق وأبدأ الانتاج";
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
        try {
            const keySelected = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(keySelected);
        } catch (e) {
            console.error("Error checking for API key:", e);
            setHasApiKey(false);
        }
    } else {
        // Fallback for when aistudio is not available
        console.warn("window.aistudio not found. Assuming API key is set via environment variable.");
        setHasApiKey(true);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume key selection is successful to avoid race condition
        setHasApiKey(true);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt) {
      setError('Please enter a prompt to generate a video.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const videoUrl = await generateVideo(prompt, aspectRatio, setLoadingMessage);
      setGeneratedVideoUrl(videoUrl);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      if (err.message.includes("API key not found")) {
        setHasApiKey(false); // Reset key state if it's invalid
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [prompt, aspectRatio]);

  if (!hasApiKey) {
    return (
        <Card>
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">API Key Required for Veo</h2>
                <p className="text-gray-400 mb-6">
                    Video generation with Veo requires a Google AI API key with billing enabled.
                    Please select your API key to proceed.
                </p>
                <p className="text-sm text-gray-500 mb-6">For more information, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI billing documentation</a>.</p>
                <Button onClick={handleSelectKey}>Select API Key</Button>
            </div>
        </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">AI Video Generator (Veo)</h2>
        <p className="text-center text-gray-400 mb-6">Describe the video you want to create. The process can take several minutes.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
                 <div>
                    <label htmlFor="video-gen-prompt" className="block text-sm font-medium text-gray-300 mb-2">1. Describe your video</label>
                    <textarea
                        id="video-gen-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A cinematic shot of a futuristic city at sunset"
                        className="w-full h-48 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        dir="auto"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Select Aspect Ratio</label>
                    <div className="flex gap-4">
                        {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`px-4 py-2 rounded-md font-semibold transition ${aspectRatio === ratio ? 'bg-orange-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
                            </button>
                        ))}
                    </div>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full !bg-orange-600 hover:!bg-orange-700">
                    {isLoading ? <><Spinner /> Generating...</> : 'Generate Video'}
                </Button>
                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>

            {/* Video Display */}
            <div className="flex flex-col items-center justify-center">
                <h3 className="font-semibold mb-2 text-gray-400">Generated Video</h3>
                 <div className={`w-full bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                    {isLoading ? (
                        <div className="text-center p-4">
                            <Spinner />
                            <p className="mt-4 text-gray-300">{loadingMessage}</p>
                        </div>
                    ) : generatedVideoUrl ? (
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-gray-500">Your generated video will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
};
