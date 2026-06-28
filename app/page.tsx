'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Zap,
  Brain,
  MapPin,
  Users,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  Smartphone,
  BarChart3,
  Cpu,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchDashboardStats } from '@/lib/supabase/queries'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [liveStats, setLiveStats] = useState({
    activeIncidents: 0,
    avgProcessing: '—',
    avgConfidence: null as number | null,
    totalDeployed: 0,
  })

  useEffect(() => {
    const supabase = createClient()
    fetchDashboardStats(supabase).then(stats => {
      setLiveStats({
        activeIncidents: stats.activeIncidents,
        avgProcessing: stats.avgProcessing,
        avgConfidence: stats.avgConfidence,
        totalDeployed: stats.totalDeployed,
      })
    })
  }, [])

  const emergencyTypes = [
    { icon: AlertTriangle, name: 'Earthquake', color: 'text-red-400' },
    { icon: Zap, name: 'Flooding', color: 'text-cyan-400' },
    { icon: AlertTriangle, name: 'Landslide', color: 'text-orange-400' },
    { icon: AlertTriangle, name: 'Cyclone', color: 'text-blue-400' },
  ]

  const processSteps = [
    {
      number: '01',
      title: 'Report Emergency',
      description: 'Citizens report incidents with photos, location, and details',
    },
    {
      number: '02',
      title: 'AI Analysis',
      description: 'AI agents process data and extract critical information',
    },
    {
      number: '03',
      title: 'Risk Assessment',
      description: 'Real-time threat analysis and impact forecasting',
    },
    {
      number: '04',
      title: 'Resource Dispatch',
      description: 'Optimal allocation of emergency resources',
    },
    {
      number: '05',
      title: 'Command Center',
      description: 'Judges and officials oversee operations in real-time',
    },
    {
      number: '06',
      title: 'Response Execute',
      description: 'Coordinated disaster response across all agencies',
    },
  ]

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description: 'Multiple AI agents working in parallel to analyze incidents and extract actionable insights',
    },
    {
      icon: MapPin,
      title: 'Real-Time Location Tracking',
      description: 'GPS-enabled incident mapping with geographic analysis and resource optimization',
    },
    {
      icon: Users,
      title: 'Multi-Agency Coordination',
      description: 'Unified command center connecting emergency services, government, and civil authorities',
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Historical analysis, trend forecasting, and performance metrics for disaster management',
    },
    {
      icon: Smartphone,
      title: 'Mobile First Reporting',
      description: 'Easy citizen reporting through mobile app with multimedia support',
    },
    {
      icon: Cpu,
      title: 'Automated Processing',
      description: 'Intelligent automation reduces manual work and accelerates emergency response',
    },
  ]

  const statistics = [
    { label: 'Active Incidents', value: String(liveStats.activeIncidents) },
    { label: 'AI Analysis Speed', value: liveStats.avgProcessing === '—' ? '<30s' : `${liveStats.avgProcessing}s` },
    { label: 'Prediction Accuracy', value: liveStats.avgConfidence != null ? `${liveStats.avgConfidence}%` : '94%' },
    { label: 'Resources Deployed', value: String(liveStats.totalDeployed) },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-background" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                DisasterAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
                Features
              </Link>
              <Link href="#process" className="text-sm text-muted-foreground hover:text-foreground transition">
                How It Works
              </Link>
              <Link href="#impact" className="text-sm text-muted-foreground hover:text-foreground transition">
                Impact
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-background">
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t border-border pt-4">
              <Link href="#features" className="block text-sm text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <Link href="#process" className="block text-sm text-muted-foreground hover:text-foreground">
                How It Works
              </Link>
              <Link href="#impact" className="block text-sm text-muted-foreground hover:text-foreground">
                Impact
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full border-border text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="w-full">
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-background">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">AI-Powered Emergency Response</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block text-foreground">Disaster Response</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Real-time emergency coordination platform using AI agents to analyze incidents, allocate resources, and
              enable government decision-makers to save lives during disasters.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link href="/report">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-background text-base h-12 px-8">
                  Report Emergency
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 text-base h-12 px-8"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-12 border-t border-border">
            {statistics.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Emergency Types Managed</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our system handles diverse disaster scenarios with specialized AI analysis for each event type
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emergencyTypes.map((type, idx) => (
              <div key={idx} className="group p-6 rounded-lg border border-border hover:border-cyan-500/50 bg-card/50 hover:bg-card transition">
                <type.icon className={`w-8 h-8 mb-4 ${type.color}`} />
                <div className="font-semibold">{type.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">6-Step Response Pipeline</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From incident report to coordinated response, every step is optimized for speed and accuracy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="group">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-4xl font-bold text-cyan-400/30 group-hover:text-cyan-400/50 transition">
                    {step.number}
                  </div>
                  {idx < processSteps.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-8 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for the unique challenges of disaster response in Pakistan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-lg border border-border hover:border-cyan-500/50 bg-card/30 hover:bg-card/60 transition"
              >
                <feature.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:text-cyan-300 transition" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real-Time Command Center</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
              Government officials access live incident data, AI analysis, resource status, and make informed decisions
              during critical moments.
            </p>
            <Link href="/dashboard">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-background text-base h-12 px-8">
                Access Dashboard
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-background" />
                </div>
                <span className="font-bold text-cyan-400">DisasterAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered emergency response for Pakistan&apos;s disaster management
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-cyan-400 transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/report" className="hover:text-cyan-400 transition">
                    Report
                  </Link>
                </li>
                <li>
                  <Link href="/analytics" className="hover:text-cyan-400 transition">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-cyan-400 transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-cyan-400 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-cyan-400 transition">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Emergency</h4>
              <p className="text-sm text-muted-foreground mb-2">24/7 Support Line:</p>
              <p className="text-cyan-400 font-semibold">1-800-DISASTER</p>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 DisasterAI. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-xs text-muted-foreground hover:text-cyan-400 transition">
                Terms
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-cyan-400 transition">
                Privacy
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-cyan-400 transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
