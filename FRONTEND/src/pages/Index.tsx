import VideoFeed from "@/components/VideoFeed";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background">
      <VideoFeed />
      <BottomNav />
    </div>
  );
};

export default Index;
