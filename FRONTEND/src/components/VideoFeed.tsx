import { useState, useRef, useEffect } from "react";
import VideoCard from "./VideoCard";

export interface Video {
  id: string;
  videoUrl: string;
  username: string;
  avatar: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  music: string;
}

const mockVideos: Video[] = [
  {
    id: "1",
    videoUrl: "https://samplelib.com/mp4/sample-5s.mp4",
    username: "traveler_soul",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    caption: "Chasing sunsets 🌅 #travel #nature",
    likes: 12400,
    comments: 234,
    shares: 89,
    music: "Summer Vibes • Chill Beats",
  },
  {
    id: "2",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    username: "urban_explorer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    caption: "City lights never sleep 🌃 #citylife #night",
    likes: 23100,
    comments: 456,
    shares: 123,
    music: "Neon Dreams • Synthwave",
  },
  {
    id: "3",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    username: "ocean_lover",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
    caption: "Ocean therapy 🌊 #beach #relax",
    likes: 34500,
    comments: 678,
    shares: 234,
    music: "Ocean Waves • Nature Sounds",
  },
  {
    id: "4",
    videoUrl: "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    username: "mountain_climber",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
    caption: "Reaching new heights ⛰️ #adventure #hiking",
    likes: 18900,
    comments: 345,
    shares: 167,
    music: "Epic Journey • Orchestral",
  },
];

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const videoHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / videoHeight);
      setCurrentIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto snap-y snap-mandatory">
      {mockVideos.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={index === currentIndex}
        />
      ))}
    </div>
  );
};

export default VideoFeed;