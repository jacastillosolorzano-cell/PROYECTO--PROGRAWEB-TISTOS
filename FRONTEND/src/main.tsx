import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
import { SaldoProvider } from './contexts/SaldoContext'; 


const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const Studio = lazy(() => import("./pages/Studio"));
const Saldo = lazy(() => import("./pages/Saldo"));
const Discover = lazy(() => import("./pages/Discover"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Create = lazy(() => import("./pages/Create"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ChatView = lazy(() => import("./pages/ChatView"));

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SaldoProvider>  
          <Toaster />
          <Sonner />
          <HashRouter basename = "/PROYECTO--PROGRAWEB-TISTOS/tree/main/FRONTEND/">
            <Suspense fallback={<div className="p-4">Cargando...</div>}>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/index" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/saldo" element={<Saldo />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/chat/:id" element={<ChatView />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/create" element={<Create />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </HashRouter>
        </SaldoProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);