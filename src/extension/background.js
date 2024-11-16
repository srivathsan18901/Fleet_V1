chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    chrome.tabCapture.capture({ audio: false, video: true }, (stream) => {
      if (stream) {
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (event) => {
          const blob = new Blob([event.data], { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: url,
            filename: 'recording.webm'
          });
        };
        recorder.start();
        setTimeout(() => recorder.stop(), 10000); // Stop recording after 10 seconds
      } else {
        console.error('Failed to capture tab');
      }
    });
  }
});
