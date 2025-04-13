import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function Landing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Handle navbar appearance on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add smooth scrolling for anchor links
  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          setIsMenuOpen(false);
        }
      });
    });
  }, []);

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* Header & Navigation */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-gray-900/95 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
        <nav className="container mx-auto flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center">
            <a href="#" className="text-2xl font-bold text-white flex items-center">
              <svg className="w-8 h-8 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 13V17M16 11V17M12 7V17M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              DataDash.io
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition">How it Works</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
            <a href="#faq" className="text-gray-300 hover:text-white transition">FAQ</a>
            <a href="/login" className="text-white hover:text-blue-400 transition">Login</a>
            <a
              href="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Start Free
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        <div className={`md:hidden bg-gray-900 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
          <div className="container mx-auto px-6 space-y-4">
            <a href="#features" className="block py-2 text-gray-300 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="block py-2 text-gray-300 hover:text-white transition">How it Works</a>
            <a href="#pricing" className="block py-2 text-gray-300 hover:text-white transition">Pricing</a>
            <a href="#faq" className="block py-2 text-gray-300 hover:text-white transition">FAQ</a>
            <a href="/login" className="block py-2 text-white hover:text-blue-400 transition">Login</a>
            <a
              href="/register"
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition text-center mt-4"
            >
              Start Free
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 px-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-700 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
            <div className="inline-block px-3 py-1 bg-blue-900/50 rounded-full text-sm font-medium text-blue-300 mb-4">
              CSV to Dashboard in Seconds
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Turn your <span className="text-blue-500">spreadsheets</span> into smart <span className="text-blue-500">dashboards</span> in seconds
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-8">
              Upload your CSV and let our AI create beautiful visualizations and insights automatically. No coding required.
            </p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <a
                href="/register"
                className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center relative overflow-hidden"
              >
                <span className="relative z-10">Try it Free</span>
                <svg className="w-5 h-5 ml-2 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine"></div>
              </a>
              <a
                href="/dashboard"
                className="border border-white text-white px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 hover:bg-white hover:text-gray-950"
              >
                Access Dashboard
              </a>
            </div>
            <div className="mt-6 text-gray-400 text-sm">
              <p>No credit card required • Free plan available</p>
            </div>
          </div>
          <div className="md:w-1/2 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-gray-800 p-2 rounded-t-lg flex items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <p className="ml-4 text-sm text-gray-400">DataDash Analytics</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-b-lg">
              <img 
                src="/images/dashboard-mockup.png" 
                alt="DataDash Dashboard Mockup" 
                className="rounded shadow-lg w-full"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/600x400/2d3748/4299e1?text=DataDash+Dashboard";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-10 px-6 bg-gray-900/50">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-sm uppercase tracking-wide mb-6">Trusted by data-driven teams worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-70">
            <img src="https://via.placeholder.com/120x40/374151/CCCCCC?text=Company" alt="Company Logo" className="h-6 md:h-8" />
            <img src="https://via.placeholder.com/120x40/374151/CCCCCC?text=Brand" alt="Brand Logo" className="h-6 md:h-8" />
            <img src="https://via.placeholder.com/120x40/374151/CCCCCC?text=Enterprise" alt="Enterprise Logo" className="h-6 md:h-8" />
            <img src="https://via.placeholder.com/120x40/374151/CCCCCC?text=Corp" alt="Corp Logo" className="h-6 md:h-8" />
            <img src="https://via.placeholder.com/120x40/374151/CCCCCC?text=Tech" alt="Tech Logo" className="h-6 md:h-8" />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="py-20 px-6 bg-gray-900">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Why choose DataDash?</h2>
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto">
            Our platform gives you powerful analytics without the complexity.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-105">
              <div className="text-blue-500 mb-6">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 14.5L9.5 12M9.5 12L12 14.5M9.5 12L12 9.5M9.5 12L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 11V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload CSV Instantly</h3>
              <p className="text-gray-400">Drag and drop your spreadsheet and get instant analytics. Supports all standard CSV formats.</p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-105">
              <div className="text-blue-500 mb-6">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20 7.5V16.5L12 22L4 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Generated Insights</h3>
              <p className="text-gray-400">Our AI finds patterns and key metrics for you automatically. Discover insights you might have missed.</p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-105">
              <div className="text-blue-500 mb-6">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L12 4L21 8L12 12L3 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12L12 16L3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 16L12 20L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Exportable Dashboards</h3>
              <p className="text-gray-400">Download your reports as PDF, PNG or CSV. Share with your team or include in presentations.</p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-105">
              <div className="text-blue-500 mb-6">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13.5C13.3807 13.5 14.5 12.3807 14.5 11C14.5 9.61929 13.3807 8.5 12 8.5C10.6193 8.5 9.5 9.61929 9.5 11C9.5 12.3807 10.6193 13.5 12 13.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Multilingual Support</h3>
              <p className="text-gray-400">Available in English, Spanish, and Portuguese. Designed for international teams and global data.</p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-105">
              <div className="text-blue-500 mb-6">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Ready in Seconds</h3>
              <p className="text-gray-400">From upload to insights in less than 10 seconds. No waiting for processing or analysis.</p>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-105">
              <div className="text-blue-500 mb-6">
                <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 9H9V15H15V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure Data Handling</h3>
              <p className="text-gray-400">Your data is encrypted and never shared with third parties. Compliant with data protection regulations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-950 relative overflow-hidden">
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-16 relative">
            {/* Connecting Line */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-gradient-to-r from-blue-600/0 via-blue-600 to-blue-600/0 hidden md:block"></div>
            
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-6 relative z-10">1</div>
              <h3 className="text-xl font-semibold mb-4">Login or Register</h3>
              <p className="text-gray-400">Sign in with Google or create an account with your email in seconds. No credit card required for free plan.</p>
            </div>
            
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-6 relative z-10">2</div>
              <h3 className="text-xl font-semibold mb-4">Upload Your CSV</h3>
              <p className="text-gray-400">Drag and drop your spreadsheet file or select it from your device. We'll handle the formatting for you.</p>
            </div>
            
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-6 relative z-10">3</div>
              <h3 className="text-xl font-semibold mb-4">Get Your Dashboard</h3>
              <p className="text-gray-400">View your data visualized with key insights highlighted automatically. Customize and share with your team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">See DataDash in Action</h2>
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto">
            From raw spreadsheet to actionable insights in seconds.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 bg-gray-700 font-medium">Step 1: Upload CSV</div>
              <div className="p-6">
                <img 
                  src="/images/upload-demo.png" 
                  alt="Upload Demo" 
                  className="rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300/374151/4299e1?text=Upload+CSV";
                  }}
                />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 bg-gray-700 font-medium">Step 2: AI Processing</div>
              <div className="p-6">
                <img 
                  src="/images/processing-demo.png" 
                  alt="Processing Demo" 
                  className="rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300/374151/4299e1?text=AI+Processing";
                  }}
                />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 bg-gray-700 font-medium">Step 3: Interactive Dashboard</div>
              <div className="p-6">
                <img 
                  src="/images/dashboard-demo.png" 
                  alt="Dashboard Demo" 
                  className="rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300/374151/4299e1?text=Interactive+Dashboard";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg relative">
              <div className="absolute -top-4 -left-4 text-blue-500 text-5xl">"</div>
              <div className="flex items-center mb-6">
                <img 
                  src="/images/testimonial-1.jpg" 
                  alt="Sarah K." 
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/64x64/4299e1/ffffff?text=S";
                  }}
                />
                <div>
                  <h4 className="font-bold">Sarah K.</h4>
                  <p className="text-gray-400">Data Analyst</p>
                </div>
              </div>
              <p className="text-gray-300">"I've saved over 10 hours per week since using DataDash. What used to take me multiple days of Excel work now happens automatically."</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg relative">
              <div className="absolute -top-4 -left-4 text-blue-500 text-5xl">"</div>
              <div className="flex items-center mb-6">
                <img 
                  src="/images/testimonial-2.jpg" 
                  alt="Miguel R." 
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/64x64/4299e1/ffffff?text=M";
                  }}
                />
                <div>
                  <h4 className="font-bold">Miguel R.</h4>
                  <p className="text-gray-400">Marketing Director</p>
                </div>
              </div>
              <p className="text-gray-300">"Our team can now make data-driven decisions instantly. The AI suggestions have helped us discover trends we never would have noticed."</p>
            </div>
            
            <div className="bg-gray-900 p-8 rounded-xl shadow-lg relative">
              <div className="absolute -top-4 -left-4 text-blue-500 text-5xl">"</div>
              <div className="flex items-center mb-6">
                <img 
                  src="/images/testimonial-3.jpg" 
                  alt="Claire T." 
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/64x64/4299e1/ffffff?text=C";
                  }}
                />
                <div>
<h4 className="font-bold">Claire T.</h4>
                  <p className="text-gray-400">Startup Founder</p>
                </div>
              </div>
              <p className="text-gray-300">"As a non-technical founder, DataDash has been a game-changer. I can now present beautiful dashboards to investors without hiring a data team."</p>
            </div>
          </div>
          
          {/* Customer Satisfaction Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-blue-500 text-4xl font-bold mb-2">98%</div>
              <p className="text-gray-400">Customer Satisfaction</p>
            </div>
            <div>
              <div className="text-blue-500 text-4xl font-bold mb-2">12k+</div>
              <p className="text-gray-400">Active Users</p>
            </div>
            <div>
              <div className="text-blue-500 text-4xl font-bold mb-2">230k+</div>
              <p className="text-gray-400">Dashboards Created</p>
            </div>
            <div>
              <div className="text-blue-500 text-4xl font-bold mb-2">8M+</div>
              <p className="text-gray-400">Data Points Analyzed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gray-900 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1 bg-blue-900/30 rounded-full text-sm font-medium text-blue-300 mb-4">
            Simple, Transparent Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose the Perfect Plan</h2>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Start for free, upgrade as you grow. No credit card required.
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="max-w-xs mx-auto mb-12 flex items-center justify-center bg-gray-800 p-1 rounded-lg">
            <button className="w-1/2 py-2 px-4 rounded-md bg-blue-600 text-white font-medium">
              Monthly
            </button>
            <button className="w-1/2 py-2 px-4 text-gray-300 font-medium hover:text-white transition">
              Annual (20% off)
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-transparent transition-all duration-300 hover:border-gray-700">
              <div className="p-8 border-b border-gray-700">
                <h3 className="text-2xl font-bold mb-4">Free</h3>
                <div className="text-4xl font-bold mb-2">$0</div>
                <p className="text-gray-400 mb-6">Forever free</p>
                <a
                  href="/register"
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Start Free
                </a>
              </div>
              <div className="p-8">
                <ul className="text-left space-y-4">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Up to 5 CSV uploads/month</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Basic visualizations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>PNG export</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>5MB file size limit</span>
                  </li>
                  <li className="flex items-center text-gray-500">
                    <svg className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>AI-powered insights</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Starter Plan - Most Popular */}
            <div className="bg-blue-900 rounded-xl overflow-hidden shadow-2xl transform scale-105 z-10 border-2 border-blue-700">
              <div className="bg-blue-800 py-2 text-sm font-medium">MOST POPULAR</div>
              <div className="p-8 border-b border-blue-800">
                <h3 className="text-2xl font-bold mb-4">Starter</h3>
                <div className="text-4xl font-bold mb-2">$19</div>
                <p className="text-gray-300 mb-6">per month</p>
                <a
                  href="/register?plan=starter"
                  className="block w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Start 7-Day Trial
                </a>
              </div>
              <div className="p-8">
                <ul className="text-left space-y-4">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Unlimited CSV uploads</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Advanced visualizations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>PDF, PNG, CSV exports</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>50MB file size limit</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>AI-powered insights</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Email support</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-transparent transition-all duration-300 hover:border-gray-700">
              <div className="p-8 border-b border-gray-700">
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <div className="text-4xl font-bold mb-2">$49</div>
                <p className="text-gray-400 mb-6">per month</p>
                <a
                  href="/register?plan=pro"
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Start 7-Day Trial
                </a>
              </div>
              <div className="p-8">
                <ul className="text-left space-y-4">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Custom dashboard themes</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>250MB file size limit</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>API access & integrations</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Enterprise Option */}
          <div className="mt-16 bg-gray-800/50 max-w-3xl mx-auto rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <p className="text-gray-300 mb-6">Need a custom solution for your large organization?</p>
            <a 
              href="/contact-sales" 
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Contact Sales
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-gray-950">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-900/50 rounded-full text-sm font-medium text-blue-300 mb-4">
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about the product and billing.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-gray-900 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What exactly is a dashboard?
              </h3>
              <p className="text-gray-300">A dashboard is a visual display of your data that allows you to quickly view key metrics, trends, and patterns. Instead of looking at raw data in spreadsheets, dashboards present information in charts, graphs, and summary cards that make insights immediately visible.</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Is it secure to upload my data to DataDash?
              </h3>
              <p className="text-gray-300">Absolutely. We take security seriously. All data is encrypted both in transit and at rest. We do not share your data with third parties, and you can delete your data at any time. We also offer secure single sign-on with Google for additional protection.</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Can I cancel my subscription at any time?
              </h3>
              <p className="text-gray-300">Yes, you can cancel your subscription at any time with no questions asked. If you cancel, you'll continue to have access until the end of your billing period. We also offer a 7-day free trial on paid plans so you can try before you commit.</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What file formats does DataDash support?
              </h3>
              <p className="text-gray-300">Currently, DataDash supports CSV (Comma Separated Values) files. We're working on adding support for Excel (.xlsx), Google Sheets integration, and database connections in upcoming releases.</p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How does the AI generate insights?
              </h3>
              <p className="text-gray-300">Our AI analyzes your data patterns and relationships between variables. It identifies trends, outliers, and correlations that might not be immediately obvious. The AI then generates plain-language descriptions of these findings and suggests the most relevant visualizations.</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <a href="/contact" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium">
              Contact our support team
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-gray-900 opacity-90"></div>
        <div className="relative container mx-auto text-center z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your spreadsheets?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who are saving time and gaining insights with DataDash.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/register"
              className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
            >
              <span>Create Your Free Account</span>
<svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#features"
              className="border border-white text-white px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 hover:bg-white hover:text-gray-950"
            >
              Learn More
            </a>
          </div>
          
          {/* Social Proof */}
          <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-6 text-sm">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-3">
                <img src="https://via.placeholder.com/40x40/4299e1/ffffff?text=U1" className="w-8 h-8 rounded-full border-2 border-gray-900" alt="User" />
                <img src="https://via.placeholder.com/40x40/4299e1/ffffff?text=U2" className="w-8 h-8 rounded-full border-2 border-gray-900" alt="User" />
                <img src="https://via.placeholder.com/40x40/4299e1/ffffff?text=U3" className="w-8 h-8 rounded-full border-2 border-gray-900" alt="User" />
              </div>
              <span className="text-gray-300">Join 12,000+ users</span>
            </div>
            <div className="flex items-center">
              <div className="flex text-yellow-400 mr-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <span className="text-gray-300">4.9/5 from 500+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="container mx-auto max-w-4xl bg-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-3">Stay updated with DataDash</h3>
              <p className="text-gray-300 mb-2">Get the latest product updates, data insights, and tips directly to your inbox.</p>
              <p className="text-gray-400 text-sm">We'll send you 1-2 emails per month. No spam, just valuable content.</p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-grow px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Email address"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 pt-16 pb-8 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between mb-12">
            {/* Company Info */}
            <div className="md:w-1/3 mb-8 md:mb-0">
              <a href="/" className="flex items-center text-2xl font-bold text-white mb-4">
                <svg className="w-8 h-8 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 13V17M16 11V17M12 7V17M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                DataDash.io
              </a>
              <p className="text-gray-400 mb-6 max-w-md">
                Transform your CSV data into beautiful, interactive dashboards with AI-powered insights. No coding required.
              </p>
              <div className="flex space-x-5">
                <a href="https://twitter.com/datadash" className="text-gray-400 hover:text-white transition" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/datadash" className="text-gray-400 hover:text-white transition" aria-label="LinkedIn">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                  </svg>
                </a>
                <a href="https://github.com/datadash" className="text-gray-400 hover:text-white transition" aria-label="GitHub">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
              <div>
                <h4 className="text-lg font-bold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white transition">Features</a></li>
                  <li><a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                  <li><a href="#faq" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                  <li><a href="/dashboard" className="text-gray-400 hover:text-white transition">Dashboard</a></li>
                  <li><a href="/integrations" className="text-gray-400 hover:text-white transition">Integrations</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-bold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="/blog" className="text-gray-400 hover:text-white transition">Blog</a></li>
                  <li><a href="/documentation" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                  <li><a href="/tutorials" className="text-gray-400 hover:text-white transition">Tutorials</a></li>
                  <li><a href="/api" className="text-gray-400 hover:text-white transition">API</a></li>
                  <li><a href="/support" className="text-gray-400 hover:text-white transition">Support</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-bold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="/about" className="text-gray-400 hover:text-white transition">About</a></li>
                  <li><a href="/contact" className="text-gray-400 hover:text-white transition">Contact</a></li>
                  <li><a href="/careers" className="text-gray-400 hover:text-white transition">Careers</a></li>
                  <li><a href="/press" className="text-gray-400 hover:text-white transition">Press</a></li>
                  <li><a href="/partners" className="text-gray-400 hover:text-white transition">Partners</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Bottom Footer */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2024 DataDash.io – All rights reserved
            </div>
            <div className="flex space-x-6">
              <a href="/terms" className="text-gray-500 text-sm hover:text-gray-300 transition">Terms</a>
              <a href="/privacy" className="text-gray-500 text-sm hover:text-gray-300 transition">Privacy</a>
              <a href="/cookies" className="text-gray-500 text-sm hover:text-gray-300 transition">Cookies</a>
              <a href="/security" className="text-gray-500 text-sm hover:text-gray-300 transition">Security</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 shadow-xl z-50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-gray-300 md:mr-8 mb-4 md:mb-0">
            <p>We use cookies to improve your experience on our site. By using our site, you agree to our use of cookies.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition">
              Cookie Settings
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition">
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;