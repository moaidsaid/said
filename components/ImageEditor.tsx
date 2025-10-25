
import React, { useState, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Spinner } from './shared/Spinner';
import { FileInput } from './shared/FileInput';
import { Button } from './shared/Button';
import { Card } from './shared/Card';

export const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImage({ file, url: URL.createObjectURL(file) });
      setEditedImage(null); // Clear previous result
      setError(null);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Image = await fileToBase64(originalImage.file);
      const newImageBase64 = await editImage(base64Image, originalImage.file.type, prompt);
      setEditedImage(`data:image/png;base64,${newImageBase64}`);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);
  
  const examplePrompts = ["Add a retro, vintage filter", "Make the sky look like a galaxy", "Turn this into a watercolor painting", "Remove the person in the background"];

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">AI Image Editor</h2>
        <p className="text-center text-gray-400 mb-6">Upload an image and describe your desired edits.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <FileInput onChange={handleFileChange} label="1. Upload Your Image" />
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">2. Describe Your Edit</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Add a retro filter"
                className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
             <div className="text-sm text-gray-400">
                <p className="font-semibold mb-2">Or try an example:</p>
                <div className="flex flex-wrap gap-2">
                    {examplePrompts.map(p => (
                        <button key={p} onClick={() => setPrompt(p)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs transition">{p}</button>
                    ))}
                </div>
            </div>
            <Button onClick={handleGenerate} disabled={isLoading || !originalImage || !prompt} className="w-full">
              {isLoading ? <><Spinner /> Generating...</> : 'Generate Edited Image'}
            </Button>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          </div>

          {/* Image Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="text-center">
              <h3 className="font-semibold mb-2 text-gray-400">Original</h3>
              <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {originalImage ? (
                  <img src={originalImage.url} alt="Original" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-gray-500">No image selected</p>
                )}
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2 text-gray-400">Edited</h3>
              <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {isLoading ? (
                  <Spinner />
                ) : editedImage ? (
                  <img src={editedImage} alt="Edited" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-gray-500">Result will appear here</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
