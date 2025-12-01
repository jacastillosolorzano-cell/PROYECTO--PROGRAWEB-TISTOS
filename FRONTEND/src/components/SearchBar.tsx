import React, { useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void; // Asegúrate de que sea (open: boolean) => void
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onEnter?: (filteredChats: any[]) => void;
  filteredChats?: any[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  onEnter,
  filteredChats = [],
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen, setSearchQuery]);

  return (
    <div className="flex-none">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const newState = !searchOpen;
          setSearchOpen(newState);
          if (newState) setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <Search className="w-5 h-5" />
      </Button>
      {searchOpen && (
        <div className="absolute top-16 left-4 right-4 z-10 bg-card p-2 rounded-md shadow-lg">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar chats o mensajes..."
              className="w-full px-3 py-2 rounded-md bg-background text-white outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredChats.length === 1 && onEnter) {
                  onEnter(filteredChats);
                }
              }}
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="p-2 rounded-md bg-transparent"
              aria-label="Cerrar búsqueda"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
