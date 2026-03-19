import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ProjectBoard from "./pages/ProjectBoard";
import Account from "./pages/Account";
import Subscription from "./pages/Subscription";
import VerificationCenter from "./pages/VerificationCenter";
import Architect from "./pages/Architect";
import Machines from "./pages/Machines";
import Credentials from "./pages/Credentials";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
            <Route path="/projects/new" element={<ProtectedRoute><AppLayout><NewProject /></AppLayout></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><AppLayout><ProjectBoard /></AppLayout></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AppLayout><Account /></AppLayout></ProtectedRoute>} />
            <Route path="/account/subscription" element={<ProtectedRoute><AppLayout><Subscription /></AppLayout></ProtectedRoute>} />
            <Route path="/verify" element={<ProtectedRoute><AppLayout><VerificationCenter /></AppLayout></ProtectedRoute>} />
            <Route path="/architect" element={<ProtectedRoute><AppLayout><Architect /></AppLayout></ProtectedRoute>} />
            <Route path="/machines" element={<ProtectedRoute><AppLayout><Machines /></AppLayout></ProtectedRoute>} />
            <Route path="/credentials" element={<ProtectedRoute><AppLayout><Credentials /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
