import { Home, Search, PlusSquare, MessageSquare, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BottomNav = () => {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const navItems = [
    { id: "home", icon: Home, label: "Home", route: "/index" },
    { id: "discover", icon: Search, label: "Discover", route: "/discover" },
    { id: "create", icon: PlusSquare, label: "Create", route: "/Create" },
    { id: "inbox", icon: MessageSquare, label: "Inbox", route: "/inbox" },
    { id: "profile", icon: User, label: "Profile", route: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCreate = item.id === "create";

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                navigate(item.route); // Navega a la ruta correspondiente
              }}
              className="flex flex-col items-center justify-center gap-1 flex-1 transition-colors"
            >
              {isCreate ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary rounded-lg blur-sm" />
                  <div className="relative bg-gradient-primary rounded-lg p-2">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                />
              )}
              <span
                className={`text-xs transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;