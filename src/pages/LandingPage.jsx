import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, Brain, TrendingUp, CheckCircle, BarChart3, Users, Clock, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navbar */}
      <nav className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">CivicLens</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="hover:text-accent transition-colors">Home</a>
              <a href="#how-it-works" className="hover:text-accent transition-colors">How It Works</a>
              <a href="#explore" className="hover:text-accent transition-colors">Explore Issues</a>
              <a href="#about" className="hover:text-accent transition-colors">About</a>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-white hover:text-accent transition-colors font-medium"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent-600 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-primary leading-tight">
                Your City. Your Voice. <span className="text-secondary">Real Change.</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Report civic issues, track their progress, and help build cleaner, safer and smarter cities across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/report')}
                  className="px-8 py-4 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Report an Issue
                </button>
                <button 
                  onClick={() => navigate('/explore')}
                  className="px-8 py-4 bg-white text-secondary border-2 border-secondary rounded-lg font-semibold hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Explore Civic Issues
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-secondary to-accent p-8 rounded-2xl shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop" 
                  alt="City Map" 
                  className="rounded-lg shadow-xl w-full h-96 object-cover"
                />
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Live Issue Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-accent mb-2">2,847</div>
              <div className="text-gray-300">Issues Reported</div>
              <div className="text-xs text-gray-400 mt-1">Demo Data</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-accent mb-2">2,134</div>
              <div className="text-gray-300">Issues Resolved</div>
              <div className="text-xs text-gray-400 mt-1">Demo Data</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-accent mb-2">423</div>
              <div className="text-gray-300">Active Complaints</div>
              <div className="text-xs text-gray-400 mt-1">Demo Data</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-accent mb-2">4.2</div>
              <div className="text-gray-300">Days Avg Resolution</div>
              <div className="text-xs text-gray-400 mt-1">Demo Data</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and effective civic issue resolution</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-secondary" />
              </div>
              <div className="w-8 h-1 bg-secondary mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">1. Report</h3>
              <p className="text-gray-600">Upload an image and share the location</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-accent" />
              </div>
              <div className="w-8 h-1 bg-accent mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Detect</h3>
              <p className="text-gray-600">AI identifies and categorizes the issue</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="w-8 h-1 bg-purple-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">3. Prioritize</h3>
              <p className="text-gray-600">Smart priority scoring for critical issues</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <div className="w-8 h-1 bg-orange-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">4. Resolve</h3>
              <p className="text-gray-600">Municipal departments take action</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="w-8 h-1 bg-green-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">5. Track</h3>
              <p className="text-gray-600">Citizens monitor progress in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Built for citizens and municipal authorities</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <Brain className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Detection</h3>
              <p className="text-gray-600">Automatic issue classification and duplicate detection using advanced AI models</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <MapPin className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Mapping</h3>
              <p className="text-gray-600">Interactive maps showing issue hotspots and real-time tracking</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics Dashboard</h3>
              <p className="text-gray-600">Comprehensive insights and performance metrics for authorities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-secondary to-accent text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of citizens making their cities better, one report at a time.</p>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-secondary rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">CivicLens</span>
          </div>
          <p className="text-gray-300 mb-4">Building smarter cities together</p>
          <p className="text-sm text-gray-400">© 2024 CivicLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
