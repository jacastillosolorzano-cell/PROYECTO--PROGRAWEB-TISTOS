import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import HeaderSaldo from "@/components/HeaderSaldo";

const sugerencias = [
  "quien creo el wifi",
  "Ulima2",
  "Ulima3",
  "Ulim4",
  "Ulima5",
  "Ulima6",
  "Ulima7",
  "Paro",
  "Ulima paro",
  "sonido llamada iphone",
];

const Discover = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <div className="flex items-center gap-2 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 flex items-center bg-card rounded px-2">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <input
            type="text"
            className="bg-transparent outline-none w-full text-foreground"
            placeholder="Buscar videos..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="link" size="sm" className="text-primary">Buscar</Button>
        </div>
      </div>
      <div className="px-6">
        <h2 className="text-lg font-bold mb-2">Podría interesarte</h2>
        <ul className="space-y-2">
          {sugerencias
            .filter(s => s.toLowerCase().includes(query.toLowerCase()))
            .map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`text-lg ${i < 2 ? "text-pink-500" : "text-muted-foreground"}`}>•</span>
                <span className={i < 2 ? "font-semibold text-pink-500" : ""}>{s}</span>
              </li>
            ))}
        </ul>
      </div>
      <div className="mt-auto">
        <BottomNav />
      </div>
    </div>
  );
};

export default Discover;