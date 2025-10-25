
import React, { useState, useRef, useCallback } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Spinner } from './shared/Spinner';
import { Button } from './shared/Button';
import { FileInput } from './shared/FileInput';
import { Card } from './shared/Card';

const FRAME_CAPTURE_INTERVAL_MS = 1000; // Capture one frame per second
const MAX_FRAMES = 30; // Limit the number of frames to send

export const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysis('');
      setError(null);
    } else {
      setError("Please select a valid video file.");
    }
  };

  const captureFrames = useCallback((): Promise<{inlineData: {data: string, mimeType: string}}[]> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) {
        return reject(new Error("Video or canvas element not found."));
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error("Could not get canvas context."));

      const frames: {inlineData: {data: string, mimeType: string}}[] = [];
      const duration = video.duration;
      const interval = duration / MAX_FRAMES;
      let currentTime = 0;
      
      video.load();

      const onSeeked = async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg'));
        if (blob) {
            const base64Data = await fileToBase64(new File([blob], "frame.jpg", { type: 'image/jpeg' }));
            frames.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
        }
        
        currentTime += interval;

        if (currentTime <= duration) {
            video.currentTime = currentTime;
        } else {
            video.removeEventListener('seeked', onSeeked);
            resolve(frames);
        }
      };
      
      video.addEventListener('seeked', onSeeked);
      video.currentTime = 0;
    });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!videoFile || !prompt) {
      setError("Please upload a video and enter a prompt.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Preparing video for analysis...');
    setError(null);
    setAnalysis('');

    try {
      setLoadingMessage('Capturing frames from video...');
      const frames = await captureFrames();
      
      if (frames.length === 0) {
        throw new Error("Could not capture any frames from the video.");
      }
      
      setLoadingMessage(`Analyzing ${frames.length} frames with Gemini...`);
      const result = await analyzeVideo(frames, prompt);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [videoFile, prompt, captureFrames]);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">AI Video Analyzer</h2>
        <p className="text-center text-gray-400 mb-6">Upload a video and ask questions about its content.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls & Video Preview */}
          <div className="space-y-4">
            <FileInput onChange={handleFileChange} accept="video/*" label="1. Upload Your Video" />
            <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {videoUrl ? (
                    <video ref={videoRef} src={videoUrl} controls className="w-full h-full object-contain" />
                ) : (
                    <p className="text-gray-500">Video preview</p>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            <div>
              <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">2. What do you want to know?</label>
              <textarea
                id="video-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Summarize this video, What objects are visible?, Describe the main activity."
                className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isLoading || !videoFile || !prompt} className="w-full">
              {isLoading ? <><Spinner /> Analyzing...</> : 'Analyze Video'}
            </Button>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          </div>

          {/* Analysis Result */}
          <div className="flex flex-col">
              <h3 className="font-semibold mb-2 text-gray-400">Analysis Result</h3>
              <div className="flex-grow bg-gray-700/50 rounded-lg p-4 prose prose-invert prose-sm max-w-none">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                      <Spinner />
                      <p className="mt-2 text-gray-400">{loadingMessage}</p>
                  </div>
                ) : analysis ? (
                    <p>{analysis}</p>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Analysis will appear here.</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
