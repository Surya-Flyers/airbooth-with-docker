import { VideoHTMLAttributes, useEffect, useRef } from "react";

type PropsType = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream;
};

export default function Video({ srcObject, ...props }: PropsType) {
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log(`v1 video element from ${props.from} MOUNTED`);

    if (!refVideo.current) return;
    refVideo.current?.load();
    refVideo.current.srcObject = srcObject;
    const playPromise = refVideo.current?.play();
    if (playPromise !== undefined) {
      playPromise
        .then((_) => {
          // Automatic playback started!
          // Show playing UI.
          console.log("V1 ####### video Playing #####");
          // refVideo.current.pause();
          // refVideo.current.currentTime = 0;
        })
        .catch((error) => {
          // Auto-play was prevented
          // Show paused UI.
          console.log("V1 ####### video Error ##### ", error);
        });
    }

    console.log("srcObject : ", srcObject);
  }, [srcObject]);

  return <video ref={refVideo} {...props} />;
}
