
import React from 'react'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#F8F7F6] flex flex-col relative overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <style>
          {`
            @keyframes float-slow {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              25% { transform: translate(15px, -15px) rotate(2deg); }
              50% { transform: translate(-5px, -25px) rotate(4deg); }
              75% { transform: translate(-20px, -10px) rotate(1deg); }
            }
            @keyframes float-medium {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              33% { transform: translate(-20px, 15px) rotate(-2deg); }
              66% { transform: translate(10px, 25px) rotate(2deg); }
            }
          `}
        </style>

        {/* Ambient Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-200/20 rounded-full blur-[120px]" />

        {/* Moving Geometric Shapes */}
        <div 
          className="absolute top-[15%] left-[8%] w-72 h-72 border border-blue-200/30 rounded-full"
          style={{ animation: 'float-slow 25s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-[10%] right-[5%] w-96 h-96 border border-cyan-200/30 rounded-full"
          style={{ animation: 'float-medium 30s ease-in-out infinite', animationDelay: '-5s' }}
        />
        <div 
          className="absolute top-[40%] right-[15%] w-24 h-24 border border-indigo-200/20 rotate-45 rounded-3xl"
          style={{ animation: 'float-slow 20s ease-in-out infinite', animationDelay: '-12s' }}
        />

        {/* Animated Lines/Particles */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="85%" cy="12%" r="4" fill="#60A5FA" className="animate-pulse" />
          <circle cx="12%" cy="85%" r="6" fill="#22D3EE" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="50%" cy="92%" r="3" fill="#818CF8" className="animate-pulse" style={{ animationDelay: '2s' }} />

          <path 
            d="M 100 100 C 200 200, 400 0, 500 100" 
            fill="none" 
            stroke="url(#grad1)" 
            strokeWidth="1.5"
            style={{ animation: 'float-medium 20s ease-in-out infinite' }}
          />
          <path 
            d="M 800 600 C 600 700, 500 500, 300 600" 
            fill="none" 
            stroke="url(#grad2)" 
            strokeWidth="1.5"
            style={{ animation: 'float-slow 25s ease-in-out infinite', animationDelay: '5s' }}
          />
          
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
              <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-6 py-12 relative z-10 text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-3xl shadow-xl shadow-blue-900/5 ring-1 ring-black/5">
            <svg className="w-20 h-20 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" className="fill-blue-600 stroke-none" />
              <path strokeWidth="1.5" strokeLinecap="round" className="opacity-80" d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9c4.97 0 9 4.03 9 9" />
              <path strokeWidth="1.5" strokeLinecap="round" className="opacity-60" d="M19.07 4.93L4.93 19.07" />
              <path strokeWidth="1.5" className="text-cyan-400" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12" transform="rotate(-45 12 12)" />
              <path strokeWidth="1.5" className="text-blue-500" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12" transform="rotate(45 12 12)" />
            </svg>
          </div>
        </div>

        {/* Headlines */}
        <h1 className="text-5xl md:text-6xl font-bold font-display text-gray-900 tracking-tight mb-6">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">Orbit Agents</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-display">
          An AI-powered assistant built for developers to streamline task execution, workflow management, and development automation. Easily integrate with any MCP server or local filesystem.
        </p>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1 text-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Desktop App
          </button>
          
          <a
            href="https://github.com/mukiwu/orbit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center gap-1 text-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Open Source
          </a>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              title: "Task Automation",
              desc: "Automate complex coding workflows with intelligent agents.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              )
            },
            {
              title: "Smart Execution",
              desc: "Run terminal commands and manage processes securely.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              )
            },
            {
              title: "Workflow Logs",
              desc: "Track every step of your automation with detailed logs.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
        
      </main>

      <footer className="relative z-10 py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Orbit Agents. All rights reserved.
      </footer>
    </div>
  )
}
