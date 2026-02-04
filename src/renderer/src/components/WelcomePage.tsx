
import screenshot from '../assets/screenshot.png'
import pkg from '../../../../package.json'

const LATEST_VERSION = pkg.version
const MAC_DOWNLOAD_URL = `https://github.com/mukiwu/orbit-agents/releases/download/v${LATEST_VERSION}/Orbit-Agents-${LATEST_VERSION}-arm64.dmg`
const WIN_DOWNLOAD_URL = `https://github.com/mukiwu/orbit-agents/releases/download/v${LATEST_VERSION}/Orbit-Agents-Setup-${LATEST_VERSION}.exe`

const TESTIMONIALS = [
  {
    name: "Alex Chen",
    role: "Senior Full Stack Dev",
    avatar: "AC",
    color: "bg-blue-500",
    text: "Orbit has completely revolutionized my workflow. I can spin up environments and run complex tasks in seconds."
  },
  {
    name: "Sarah Miller", 
    role: "DevOps Engineer",
    avatar: "SM",
    color: "bg-emerald-500",
    text: "The ability to run local scripts securely through the agent interface is a game changer for our deployment pipeline."
  },
  {
    name: "David Kim",
    role: "Frontend Lead", 
    avatar: "DK",
    color: "bg-purple-500",
    text: "I love the UI! It's formatted logically and the animations make it feel alive. Best dev tool I've used this year."
  },
  {
    name: "Emily Zhang",
    role: "AI Researcher",
    avatar: "EZ", 
    color: "bg-indigo-500",
    text: "Integrating local LLMs with Orbit was seamless. The MCP support opens up so many possibilities."
  },
  {
    name: "Michael Brown",
    role: "System Archtect",
    avatar: "MB",
    color: "bg-orange-500", 
    text: "Finally, an AI agent that actually understands my local filesystem context without jumping through hoops."
  },
  {
    name: "Jessica Wu",
    role: "Product Manager",
    avatar: "JW",
    color: "bg-pink-500",
    text: "Even as a PM, I find Orbit incredibly useful for automating my daily reporting tasks and data analysis."
  },
  {
    name: "Tom Wilson",
    role: "Backend Developer",
    avatar: "TW", 
    color: "bg-cyan-500",
    text: "The terminal integration is flawless. It feels like having a senior pair programmer right in my IDE."
  },
  {
    name: "Lisa Anderson",
    role: "QA Lead",
    avatar: "LA",
    color: "bg-red-500",
    text: "Automating our regression testing suites has never been easier. Orbit handles the edge cases perfectly."
  },
  {
    name: "Ryan Garcia",
    role: "Cloud Engineer",
    avatar: "RG",
    color: "bg-teal-500",
    text: "I use Orbit to manage my AWS CLI scripts. It's safer and faster than running them manually every time."
  },
  {
    name: "Kevin White",
    role: "Indie Hacker",
    avatar: "KW",
    color: "bg-gray-600",
    text: "Built my MVP in half the time thanks to Orbit. It handles the boring boilerplate stuff so I can focus on features."
  }
]

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
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              33% { transform: translate(-20px, 15px) rotate(-2deg); }
              66% { transform: translate(10px, 25px) rotate(2deg); }
            }
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}
        </style>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} 
        />

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
        <div 
          className="absolute top-[20%] left-[85%] w-16 h-16 bg-blue-100/20 rotate-12 rounded-2xl backdrop-blur-sm"
          style={{ animation: 'float-medium 22s ease-in-out infinite', animationDelay: '-8s' }}
        />
        <div 
          className="absolute bottom-[30%] left-[10%] w-32 h-32 border-2 border-dashed border-sky-200/20 rounded-full"
          style={{ animation: 'float-slow 28s ease-in-out infinite', animationDelay: '-15s' }}
        />
        <div 
          className="absolute top-[60%] left-[50%] w-20 h-20 border border-purple-200/20 rotate-45"
          style={{ animation: 'float-medium 24s ease-in-out infinite', animationDelay: '-2s' }}
        />
        {/* Tiny particles */}
        <div className="absolute top-[25%] left-[25%] w-2 h-2 bg-blue-300/40 rounded-full" style={{ animation: 'float-slow 15s ease-in-out infinite' }} />
        <div className="absolute top-[75%] right-[25%] w-3 h-3 bg-cyan-300/40 rounded-full" style={{ animation: 'float-medium 18s ease-in-out infinite', animationDelay: '-5s' }} />
        <div className="absolute bottom-[15%] left-[40%] w-2 h-2 bg-indigo-300/40 rounded-full" style={{ animation: 'float-slow 20s ease-in-out infinite', animationDelay: '-10s' }} />

        {/* Animated Lines/Particles */}
        <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
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
      <main className="flex-1 flex flex-col items-center w-full py-12 relative z-10 text-center">
        <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center">
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
              <a 
                href={MAC_DOWNLOAD_URL}
                className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-lg"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 19.349c-.854 1.25-1.764 2.495-3.13 2.52-1.353.025-1.788-.804-3.34-.804-1.536 0-2.004.78-3.296.828-1.304.049-2.296-1.325-3.125-2.524C2.378 16.63 1.01 12.062 2.72 8.996c.884-1.556 2.464-2.537 4.195-2.564 1.305-.022 2.535.877 3.333.877.785 0 2.256-1.085 3.826-.917.653.027 2.49.255 3.655 1.964-.093.058-2.186 1.275-2.164 3.81.025 3.012 2.67 4.025 2.697 4.036-.026.069-.418 1.436-1.365 2.809l-.248.34zM12.984 3.52c.732-.888 1.225-2.122 1.09-3.267-1.056.042-2.336.78-3.087 1.635-.678.756-1.27 1.96-1.096 3.12 1.183.091 2.39-.63 3.093-1.488z" />
                </svg>
                Download for Mac
              </a>
              <a 
                href={WIN_DOWNLOAD_URL}
                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-lg"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m9.75 9.413L0 19.488V12h9.75m2.25-10.413L24 0v11.458H12M24 24l-12-1.583v-9.967H24"/>
                </svg>
                Download for Windows
              </a>
              
              <a
              href="https://github.com/mukiwu/orbit-agents"
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

          {/* Product Screenshot */}
          <div className="mt-16 w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-900/10 transform transition-all hover:scale-[1.01] duration-500">
            <img 
              src={screenshot} 
              alt="Orbit App Interface" 
              className="w-full h-auto bg-white"
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="w-full mt-24 mb-10 overflow-hidden relative">
           <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F8F7F6] to-transparent z-10" />
           <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F8F7F6] to-transparent z-10" />
           
           <div 
             className="flex gap-6 w-max"
             style={{ animation: 'marquee 60s linear infinite' }}
           >
             {[...TESTIMONIALS, ...TESTIMONIALS].map((review, i) => (
               <div 
                 key={i} 
                 className="w-[350px] bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm flex flex-col gap-4 text-left"
               >
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${review.color}`}>
                      {review.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 leading-tight">{review.name}</h4>
                      <p className="text-xs text-gray-500">{review.role}</p>
                    </div>
                 </div>
                 <p className="text-gray-600 text-sm leading-relaxed">
                   "{review.text}"
                 </p>
                 <div className="flex gap-0.5">
                   {Array.from({ length: 5 }).map((_, starIndex) => (
                     <svg key={starIndex} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Live Feature Showcase */}
        <div className="w-full max-w-6xl mx-auto px-6 py-24 space-y-32">
          
          {/* Feature 1: Smart Scheduling */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Smart Scheduling
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display">
                Automate on <br/><span className="text-blue-600">Your Terms</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Forget complex cron syntax. Use our intuitive interface to schedule tasks by interval, daily, weekly, or monthly. 
                Orbit handles the timing precisely, so your agents run exactly when needed.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-900/5 p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-sm font-medium text-gray-700">Schedule Mode</label>
                     <div className="flex bg-gray-100 rounded-lg p-1">
                       <button className="px-3 py-1 text-xs font-medium bg-white shadow-sm rounded-md text-gray-900">Simple</button>
                       <button className="px-3 py-1 text-xs font-medium text-gray-500">Advanced</button>
                     </div>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                     <div className="flex gap-2">
                        {['Interval', 'Daily', 'Weekly'].map(t => (
                          <button key={t} className={`flex-1 py-1.5 text-xs font-medium rounded-md border ${t === 'Weekly' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                            {t}
                          </button>
                        ))}
                     </div>
                     <div className="flex items-center gap-3 pt-2">
                       <span className="text-sm text-gray-600">Every</span>
                       <select className="flex-1 bg-white border border-gray-200 text-sm rounded-lg px-2 py-1.5">
                         <option>Monday</option>
                       </select>
                       <span className="text-sm text-gray-600">at</span>
                       <input type="time" defaultValue="09:00" className="bg-white border border-gray-200 text-sm rounded-lg px-2 py-1.5 w-24" />
                     </div>
                     <div className="pt-2 flex items-center gap-2 text-xs text-blue-600 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Runs every Monday at 09:00 AM
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Validated Execution (Terminal) */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Transparent Execution
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display">
                See What the <br/><span className="text-emerald-600">Agent Sees</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Full visibility into every action. Watch the agent think, execute commands, and process files in real-time through our streaming log interface.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="bg-gray-900 rounded-2xl shadow-xl shadow-emerald-900/20 ring-1 ring-black/5 p-0 overflow-hidden transform -rotate-2 hover:rotate-0 transition-transform duration-500 font-mono text-sm leading-relaxed">
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"/>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"/>
                  </div>
                  <div className="ml-2 text-gray-400 text-xs">orbit-agent — execution-log</div>
                </div>
                <div className="p-5 space-y-2 text-gray-300">
                  <div className="flex gap-2">
                     <span className="text-emerald-400">➜</span>
                     <span>Analyzing project structure...</span>
                  </div>
                  <div className="flex gap-2 text-gray-400">
                     <span className="text-blue-400">ℹ</span>
                     <span>Found package.json in /src</span>
                  </div>
                   <div className="flex gap-2">
                     <span className="text-emerald-400">➜</span>
                     <span>Running security audit...</span>
                  </div>
                  <div className="pl-4 text-emerald-300/80">
                    Scanning 482 dependencies...<br/>
                    No critical vulnerabilities found.
                  </div>
                  <div className="flex gap-2 animate-pulse">
                     <span className="text-emerald-400">➜</span>
                     <span>Generating report...<span className="w-2 h-4 bg-emerald-500 inline-block align-middle ml-1"/></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Model & MCP Selection */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Model Context Protocol
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display">
                Plug-and-Play <br/><span className="text-purple-600">Integrations</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Connect your favorite LLMs (Claude, Gemini) with local tools using standard MCP servers. 
                Grant agents access to files, databases, and APIs securely.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md">
               <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-900/5 p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500 relative">
                  {/* Floating badges */}
                  <div className="absolute -top-4 -right-4 bg-white p-2 rounded-lg shadow-lg ring-1 ring-black/5 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center text-orange-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-white p-2 rounded-lg shadow-lg ring-1 ring-black/5 animate-bounce" style={{ animationDuration: '4s' }}>
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Provider</label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 rounded-lg border-2 border-purple-500/20 bg-purple-50 text-purple-700 font-medium text-sm flex items-center justify-center gap-2">
                           Claude Opus 4.5
                        </div>
                        <div className="flex-1 p-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-500 font-medium text-sm flex items-center justify-center gap-2 opacity-60">
                           Gemini 3 Pro
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Active Tools (MCP)</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500"/>
                             <span className="text-sm font-medium text-gray-700">FileSystem Access</span>
                           </div>
                           <div className="px-2 py-0.5 bg-gray-200 rounded text-[10px] font-medium text-gray-600">Connected</div>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500"/>
                             <span className="text-sm font-medium text-gray-700">GitHub Integration</span>
                           </div>
                           <div className="px-2 py-0.5 bg-gray-200 rounded text-[10px] font-medium text-gray-600">Connected</div>
                        </div>
                         <div className="flex items-center justify-between p-2.5 bg-white border border-dashed border-gray-300 rounded-lg opacity-60">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-gray-300"/>
                             <span className="text-sm font-medium text-gray-500">PostgreSQL</span>
                           </div>
                           <div className="text-xs text-blue-500 font-medium">+ Add</div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 mb-20 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 font-display">Ready to supercharge your workflow?</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={MAC_DOWNLOAD_URL}
                className="px-8 py-5 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-xl"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 19.349c-.854 1.25-1.764 2.495-3.13 2.52-1.353.025-1.788-.804-3.34-.804-1.536 0-2.004.78-3.296.828-1.304.049-2.296-1.325-3.125-2.524C2.378 16.63 1.01 12.062 2.72 8.996c.884-1.556 2.464-2.537 4.195-2.564 1.305-.022 2.535.877 3.333.877.785 0 2.256-1.085 3.826-.917.653.027 2.49.255 3.655 1.964-.093.058-2.186 1.275-2.164 3.81.025 3.012 2.67 4.025 2.697 4.036-.026.069-.418 1.436-1.365 2.809l-.248.34zM12.984 3.52c.732-.888 1.225-2.122 1.09-3.267-1.056.042-2.336.78-3.087 1.635-.678.756-1.27 1.96-1.096 3.12 1.183.091 2.39-.63 3.093-1.488z" />
                </svg>
                Download for Mac
              </a>
              <a 
                href={WIN_DOWNLOAD_URL}
                className="px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-xl"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m9.75 9.413L0 19.488V12h9.75m2.25-10.413L24 0v11.458H12M24 24l-12-1.583v-9.967H24"/>
                </svg>
                Download for Windows
              </a>
            </div>
            <p className="mt-4 text-gray-500 text-sm">Available for macOS and Windows</p>
        </div>
        
      </main>

      <footer className="relative z-10 py-8 border-t border-gray-200/40 bg-white/30 backdrop-blur-sm mt-auto">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Orbit Agents. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://www.facebook.com/mukispace" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#1877F2] transition-colors duration-300 transform hover:scale-110"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            
            <a 
              href="https://discord.gg/NCSWFkzf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#5865F2] transition-colors duration-300 transform hover:scale-110"
              aria-label="Discord"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
