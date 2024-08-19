import React, { useEffect } from 'react';

const VideoFeed = ({ videoRef, onLoadedMetadata }) => {
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            onLoadedMetadata();
            videoRef.current.play();
          };
        }
      })
      .catch(err => console.error("Error accessing the camera", err));
  }, [onLoadedMetadata, videoRef]);

  return <video ref={videoRef} autoPlay muted />;
};

export default VideoFeed;
