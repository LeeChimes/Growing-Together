import React, { useState } from 'react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Leaf, Users, AlertCircle, CheckCircle } from 'lucide-react';

const AuthScreen = () => {
  const auth = useAuth();
  
  if (!auth) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Loading authentication...</p>
    </div>;
  }
  
  const { login, register } = auth;
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    joinCode: '',
    plotNumber: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const result = await login(loginData.email, loginData.password);
    
    if (!result.success) {
      setMessage({ type: 'error', text: result.error });
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }

    const result = await register({
      email: registerData.email,
      username: registerData.username,
      password: registerData.password,
      join_code: registerData.joinCode,
      plot_number: registerData.plotNumber || null
    });
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Clear form
      setRegisterData({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        joinCode: '',
        plotNumber: ''
      });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-600 text-white p-3 rounded-full mr-3">
              <Leaf size={32} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-green-800">Growing Together</h1>
              <p className="text-sm text-green-600">Stafford Road Allotment</p>
            </div>
          </div>
          <p className="text-gray-600 flex items-center justify-center">
            <Users size={16} className="mr-2" />
            Connect with your allotment community
          </p>
        </div>

        {/* Message display */}
        {message.text && (
          <Alert className={`mb-4 ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Auth forms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-800">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Join Community</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="form-label">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="form-input"
                      data-testid="login-email-input"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="form-label">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="form-input"
                      data-testid="login-password-input"
                      placeholder="Your password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-accessible bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                    data-testid="login-submit-btn"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                {/* Demo credentials */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</p>
                  <p className="text-xs text-blue-700">
                    <strong>Admin:</strong> admin@staffordallotment.com / admin123
                  </p>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-username" className="form-label">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                        className="form-input"
                        data-testid="register-username-input"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-plot" className="form-label">Plot Number (Optional)</Label>
                      <Input
                        id="register-plot"
                        type="text"
                        value={registerData.plotNumber}
                        onChange={(e) => setRegisterData({ ...registerData, plotNumber: e.target.value })}
                        className="form-input"
                        data-testid="register-plot-input"
                        placeholder="e.g. 12A"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-email" className="form-label">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="form-input"
                      data-testid="register-email-input"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-join-code" className="form-label">Join Code</Label>
                    <Input
                      id="register-join-code"
                      type="text"
                      value={registerData.joinCode}
                      onChange={(e) => setRegisterData({ ...registerData, joinCode: e.target.value })}
                      required
                      className="form-input"
                      data-testid="register-join-code-input"
                      placeholder="Get this from an admin"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-password" className="form-label">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        className="form-input"
                        data-testid="register-password-input"
                        placeholder="Min 6 characters"
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-confirm-password" className="form-label">Confirm Password</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                        className="form-input"
                        data-testid="register-confirm-password-input"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-accessible bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                    data-testid="register-submit-btn"
                  >
                    {isLoading ? 'Joining...' : 'Join Community'}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Your account will need admin approval before you can fully access the community features.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Demo join code: <strong>GROW2024</strong>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Growing together, one plot at a time 🌱</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;