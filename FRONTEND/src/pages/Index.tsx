import VideoFeed from "@/components/VideoFeed";
import BottomNav from "@/components/BottomNav";
import HeaderSaldo from "@/components/HeaderSaldo"; // Nuevo

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="p-4 flex justify-center">
        
      </div>
      <VideoFeed />
      <BottomNav />
    </div>
  );
};

export default Index;