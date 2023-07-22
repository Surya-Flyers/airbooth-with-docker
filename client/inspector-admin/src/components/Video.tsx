import { VideoHTMLAttributes, useEffect, useRef } from "react";

type PropsType = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream;
};

export default function Video({ srcObject, ...props }: PropsType) {
  const refVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log(`v1 video element from ${props.from} MOUNTED`);
    console.log(`v1 srcObject from ${props.from}  : `, srcObject);
    if (!refVideo.current) return;
    refVideo.current?.load();
    refVideo.current.srcObject = srcObject;
    const playPromise = refVideo.current?.play();
    if (playPromise !== undefined) {
      playPromise
        .then((_) => {
          // Automatic playback started!
          // Show playing UI.
          console.log(`V1 ####### video Playing ${props.from} ##### `);
          console.log("v1 SUCCESS srcObject : ", srcObject);
          // refVideo.current.pause();
          // refVideo.current.currentTime = 0;
        })
        .catch((error) => {
          // Auto-play was prevented
          // Show paused UI.
          console.log(`V1 ####### video Error ${props.from} ##### `, error);
          console.log("v1 ERROR srcObject : ", srcObject);
        });
    }
  }, [srcObject]);

  return (
    <video
      style={{
        border: "2px solid grey",
        margin: "2px",
      }}
      ref={refVideo}
      {...props}
      onClick={() => {
        const playPromise = refVideo.current?.play();
        if (playPromise !== undefined) {
          playPromise
            .then((_) => {
              // Automatic playback started!
              // Show playing UI.
              console.log(`V1 B ####### video Playing ${props.from} ##### `);
              console.log("v1 B SUCCESS srcObject : ", srcObject);
              // refVideo.current.pause();
              // refVideo.current.currentTime = 0;
            })
            .catch((error) => {
              // Auto-play was prevented
              // Show paused UI.
              console.log(
                `V1 B ####### video Error ${props.from} ##### `,
                error
              );
              console.log("v1 B ERROR srcObject : ", srcObject);
            });
        }
      }}
    />
  );
}
