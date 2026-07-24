const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

const restoreCode = `  const openCustomCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission') || err?.message?.includes('denied')) {
        alert("Camera access was denied. Please allow camera access to capture photos.");
      } else {
        alert("Could not access camera. Please check your device permissions.");
      }
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const width = videoRef.current.videoWidth || 640;
      const height = videoRef.current.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "camera_capture.jpg", { type: 'image/jpeg' });
            setFile(capturedFile);
            closeCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleMicClick = async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      setIsAudioPaused(false);
      setAudioStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioBlob(audioBlob);
            setShowAudioTrimmer(true);
          }
          if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecordingAudio(true);
      } catch (error: any) {
        if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission') || error?.message?.includes('denied')) {
          alert("Microphone access was denied. Please allow microphone access to record audio.");
        } else {
          alert("Could not access microphone: " + (error?.message || "Unknown error"));
        }
      }
    }
  };

  const deletePost = async (id: string) => {
    await fetchApi(\`/api/posts/\${id}\`, { method: 'DELETE' });
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetchApi(\`/api/messages/\${messageId}/react\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (e) {
      console.error(e);
    }
  };
`;

code = code.replace(
  "  const messagesEndRef = useRef<HTMLDivElement>(null);",
  restoreCode + "\n\n  const messagesEndRef = useRef<HTMLDivElement>(null);"
);

fs.writeFileSync('src/components/MainApp.tsx', code);
