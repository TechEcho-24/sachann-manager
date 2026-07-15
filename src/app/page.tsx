import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, PieChart, Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-brand-green/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-green/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[50%] rounded-full bg-brand-terracotta/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-background/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <Image src="/favicon.png" alt="Sachann Logo" width={32} height={32} className="object-cover" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-green to-brand-terracotta">
            Sachann Manager
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all shadow-md active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center lg:px-8 mt-20 mb-32">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-brand-green/10 border border-brand-green/20">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-xs font-semibold text-brand-green uppercase tracking-wider">
            Premium Food Brand Manager
          </span>
        </div>
        
        <h1 className="max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
          Master your finances with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-terracotta to-brand-mustard animate-gradient-x">
            absolute clarity.
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
          Track expenses, set smart budgets, and visualize your food brand's financial health with our beautifully designed, intuitive platform. Take control today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="group flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-brand-green rounded-full hover:bg-brand-green-light transition-all shadow-xl shadow-brand-green/25 hover:shadow-brand-green/40 active:scale-95"
          >
            Enter Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full bg-card text-foreground border border-border hover:bg-muted transition-all shadow-sm active:scale-95"
          >
            Log In to Account
          </Link>
        </div>

        {/* Feature Highlights Mini */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mt-24">
          {[
            { icon: Wallet, title: "Smart Tracking", desc: "Log your daily expenses in seconds with smart categorization." },
            { icon: PieChart, title: "Visual Reports", desc: "Understand your spending habits with interactive, beautiful charts." },
            { icon: BarChart3, title: "Budget Goals", desc: "Set limits and get notified before you overspend." },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-card border border-border shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

