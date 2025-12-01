import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music2, X, RotateCcw, Timer, Layout, Mic, ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";

const Create = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("foto");

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X className="w-6 h-6" />
        </Button>
        <div className="flex-1 flex items-center bg-card rounded px-2">
          <Music2 className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Agregar sonido...</span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 mt-60">
        <div className="flex flex-col items-end gap-4 absolute right-8 top-32">
          <Button variant="ghost" size="icon"><RotateCcw className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><X className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><Timer className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><Layout className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><Mic className="w-6 h-6" /></Button>
          <Button variant="ghost" size="icon"><ChevronDown className="w-6 h-6" /></Button>
        </div>
        <div className="flex items-center gap-4 mt-32">
          <Button variant={mode === "min" ? "secondary" : "outline"} size="sm" onClick={() => setMode("min")}>min</Button>
          <Button variant={mode === "60s" ? "secondary" : "outline"} size="sm" onClick={() => setMode("60s")}>60 s</Button>
          <Button variant={mode === "15s" ? "secondary" : "outline"} size="sm" onClick={() => setMode("15s")}>15 s</Button>
          <Button variant={mode === "foto" ? "secondary" : "outline"} size="sm" onClick={() => setMode("foto")}>FOTO</Button>
          <Button variant={mode === "texto" ? "secondary" : "outline"} size="sm" onClick={() => setMode("texto")}>TEXTO</Button>
        </div>
        <div className="flex items-center justify-center mt-6">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-background flex items-center justify-center">
            <Button variant="secondary" size="icon" className="w-20 h-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-8 mb-8">
            <span className="text-purple-500 font-bold">AI SELF</span>
            <span className="font-bold text-foreground">PUBLICACIÓN</span>
            <span className="text-muted-foreground">CREAR</span>
      </div>
      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Create;