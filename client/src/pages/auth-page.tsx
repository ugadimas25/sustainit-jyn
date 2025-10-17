import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Shield, Satellite, BarChart3 } from "lucide-react";
import { useState } from "react";
import { insertUserSchema } from "@shared/schema";
import { Redirect } from "wouter";
import { kpnLogoDataUrl } from "@/assets/kpn-logo-base64";
import plantationBgImage from "@assets/6194adcbbd9b6_1754556162332.jpg";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const [loginData, setLoginData] = useState({ username: "kpncompliance2025", password: "kpncompliance2025" });
  const [registerData, setRegisterData] = useState({ 
    username: "", 
    password: "", 
    name: "", 
    email: "", 
    role: "compliance_officer" 
  });

  // Redirect if already logged in
  if (user && !permissionsLoading) {
    // Check if user has admin permissions - redirect to User Management
    if (hasAnyPermission(['user_management.view_users', 'user_management.create_users'])) {
      return <Redirect to="/admin/users" />;
    }
    // Otherwise redirect to dashboard
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = insertUserSchema.parse(registerData);
      registerMutation.mutate(validatedData);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-kpn-red to-kpn-red-dark relative">
        <div className="absolute inset-0">
          <img 
            src={plantationBgImage} 
            alt="Palm oil plantation with dirt road through green palm trees" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-8 p-3 shadow-lg">
            <img 
              src={kpnLogoDataUrl} 
              alt="KPN Corp Plantation Division Logo" 
              className="w-full h-full object-contain"
              data-testid="img-kpn-logo-auth"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">KPN Compliance Platform</h1>
          <p className="text-xl mb-8 text-white/95 drop-shadow-md">
            Comprehensive supply chain compliance monitoring for EU Deforestation Regulation
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold drop-shadow-md">Legal Compliance</h3>
                <p className="text-white/90 drop-shadow-sm">Automated legality verification and document management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md">
                <Satellite className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold drop-shadow-md">Deforestation Monitoring</h3>
                <p className="text-white/90 drop-shadow-sm">Real-time satellite alerts via Global Forest Watch integration</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold drop-shadow-md">Supply Chain Traceability</h3>
                <p className="text-white/90 drop-shadow-sm">Complete plot-to-export tracking and DDS report generation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-kpn-red rounded-xl flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to KPN Compliance Platform</h2>
            <p className="text-gray-600 mt-2">Sign in to access your compliance dashboard</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        data-testid="input-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        data-testid="input-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-kpn-red hover:bg-kpn-red-dark"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Register a new account to access the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        data-testid="input-reg-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        data-testid="input-reg-password"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-kpn-red hover:bg-kpn-red-dark"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>EU Deforestation Regulation Compliance System</p>
            <p className="mt-1">Version 1.0 • Secure Access</p>
            <p className="mt-3">
              Developed by{" "}
              <a 
                href="https://sustainit.id/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-kpn-red hover:text-kpn-red-dark font-medium transition-colors"
                data-testid="link-sustainit"
              >
                sustainIT
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
