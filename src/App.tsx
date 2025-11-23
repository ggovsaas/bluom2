import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from './components/Navigation';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Fuel from './pages/Fuel';
import Move from './pages/Move';
import Wellness from './pages/Wellness';
import Progress from './pages/Progress';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Recipes from './pages/Recipes';
import Workouts from './pages/Workouts';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Privacy from './pages/Privacy';
import Help from './pages/Help';
import Admin from './pages/Admin';
import CreateRecipe from './pages/CreateRecipe';
import MyRecipes from './pages/MyRecipes';
import { UserProvider } from './context/UserContext';
import './App.css';

// Navigation component that only shows on app pages
function AppNavigation() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/landingpage';
  const isOnboardingPage = location.pathname === '/onboarding';
  const isSignupPage = location.pathname === '/signup';
  const isLoginPage = location.pathname === '/login';
  
  if (isLandingPage || isOnboardingPage || isSignupPage || isLoginPage) {
    return null;
  }
  
  return <Navigation />;
}

// Header component that shows on all pages except landing
function AppHeader() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/landingpage';
  const isOnboardingPage = location.pathname === '/onboarding';
  const isSignupPage = location.pathname === '/signup';
  const isLoginPage = location.pathname === '/login';
  
  if (isLandingPage || isOnboardingPage || isSignupPage || isLoginPage) {
    return null;
  }
  
  return <Header />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated - stay logged in forever once logged in
    const user = localStorage.getItem('aifit_user');
    const hasSignedUp = localStorage.getItem('aifit_signed_up');
    const hasCompletedOnboarding = localStorage.getItem('aifit_onboarding_completed');
    
    // TEMPORARY: Allow bypass for testing when database is down
    const bypassAuth = localStorage.getItem('aifit_bypass_auth');
    if (bypassAuth === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    if (user) {
      // User is logged in
      setIsAuthenticated(true);
      if (!hasSignedUp && !hasCompletedOnboarding) {
        // User logged in but needs to complete onboarding first
        setShowOnboarding(true);
      }
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('aifit_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('aifit_user');
    localStorage.removeItem('aifit_onboarding_completed');
    setIsAuthenticated(false);
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✨</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <UserProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/landingpage" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />
          <Route path="/*" element={
            <div className="min-h-screen">
              <AppHeader />
              <AnimatePresence mode="wait">
                <motion.div
                  key="app-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pb-20"
                >
                  <Routes>
                    <Route path="/" element={isAuthenticated ? <Home /> : <Login />} />
                    <Route path="/app" element={isAuthenticated ? <Home /> : <Login />} />
                    <Route path="/fuel" element={isAuthenticated ? <Fuel /> : <Login />} />
                    <Route path="/move" element={isAuthenticated ? <Move /> : <Login />} />
                    <Route path="/wellness" element={isAuthenticated ? <Wellness /> : <Login />} />
                    <Route path="/progress" element={isAuthenticated ? <Progress /> : <Login />} />
                    <Route path="/premium" element={isAuthenticated ? <Premium /> : <Login />} />
                    <Route path="/profile" element={isAuthenticated ? <Profile /> : <Login />} />
                    <Route path="/recipes" element={isAuthenticated ? <Recipes /> : <Login />} />
                    <Route path="/workouts" element={isAuthenticated ? <Workouts /> : <Login />} />
                    <Route path="/friends" element={isAuthenticated ? <Friends /> : <Login />} />
                    <Route path="/settings" element={isAuthenticated ? <Settings /> : <Login />} />
                    <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Login />} />
                    <Route path="/privacy" element={isAuthenticated ? <Privacy /> : <Login />} />
                    <Route path="/help" element={isAuthenticated ? <Help /> : <Login />} />
                    <Route path="/admin" element={isAuthenticated ? <Admin /> : <Login />} />
                    <Route path="/create-recipe" element={isAuthenticated ? <CreateRecipe /> : <Login />} />
                    <Route path="/my-recipes" element={isAuthenticated ? <MyRecipes /> : <Login />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
              <AppNavigation />
            </div>
          } />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;