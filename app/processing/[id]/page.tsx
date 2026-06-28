'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, AlertCircle, Brain, MapPin, Users, TrendingUp } from 'lucide-react'
import type { Incident } from '@/lib/supabase/queries'
import { formatCoordinates, formatIncidentType, formatSeverity } from '@/lib/format'

const DONE_STATUSES = new Set(['response_active', 'dispatch_sent', 'monitoring', 'resolved'])

export default function AIProcessingScreen() {
  const params = useParams()
  const router = useRouter()
  const incidentId = params.id as string

  const [animatedSteps, setAnimatedSteps] = useState<number[]>([])
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [processingDone, setProcessingDone] = useState(false)
  const [processingStarted, setProcessingStarted] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/incidents/${incidentId}`)
      .then(res => res.json())
      .then(json => {
        if (json.incident) {
          const data = json.incident as Incident
          setIncident(data)
          if (DONE_STATUSES.has(data.status)) {
            setProcessingDone(true)
            setProcessingStarted(true)
          } else if (data.status === 'processing') {
            setProcessingStarted(true)
          }
        }
      })
      .catch(() => {})
  }, [incidentId])

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedSteps(prev => (prev.length < 8 ? [...prev, prev.length] : prev))
    }, 800)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const agents = ['data-extraction', 'risk-analysis', 'resource-dispatch', 'impact-forecast', 'nlp-analysis']
    let currentIndex = 0
    const agentTimer = setInterval(() => {
      setActiveAgent(agents[currentIndex])
      currentIndex = (currentIndex + 1) % agents.length
    }, 2500)
    return () => clearInterval(agentTimer)
  }, [])

  useEffect(() => {
    if (processingDone || processingError) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/incidents/${incidentId}`)
        const json = await res.json()
        if (!json.incident) return

        const data = json.incident as Incident
        setIncident(data)

        if (DONE_STATUSES.has(data.status)) {
          setProcessingDone(true)
          setProcessingStarted(true)
          return
        }

        if (data.status === 'processing') {
          setProcessingStarted(true)
        }
      } catch {
        // keep polling
      }
    }

    poll()
    const interval = setInterval(poll, 2500)
    return () => clearInterval(interval)
  }, [incidentId, processingDone, processingError])

  useEffect(() => {
    if (processingDone || processingError || processingStarted) return

    const timeout = setTimeout(() => {
      setProcessingError(
        'AI processing is taking longer than expected. Your report is saved — notifications will continue in the background.'
      )
    }, 120000)

    return () => clearTimeout(timeout)
  }, [processingDone, processingError, processingStarted])

  const processingSteps = [
    { id: 1, label: 'Data Intake', duration: '2.1s', icon: '📥' },
    { id: 2, label: 'Photo Analysis', duration: '3.4s', icon: '📸' },
    { id: 3, label: 'Location Validation', duration: '1.2s', icon: '🗺️' },
    { id: 4, label: 'Severity Assessment', duration: '2.8s', icon: '⚠️' },
    { id: 5, label: 'Resource Matching', duration: '1.9s', icon: '🏥' },
    { id: 6, label: 'Impact Modeling', duration: '4.1s', icon: '📊' },
    { id: 7, label: 'Alert Generation', duration: '0.8s', icon: '🚨' },
    { id: 8, label: 'Dispatch Initiation', duration: '1.2s', icon: '🚗' },
  ]

  const agents = [
    { id: 'data-extraction', name: 'Data Extraction Agent', progress: 87, findings: 'Extracted key entities from incident report including location, damage assessment, and contact info', icon: Brain },
    { id: 'risk-analysis', name: 'Risk Analysis Agent', progress: 65, findings: 'Identified secondary hazards based on incident type and severity', icon: AlertCircle },
    { id: 'resource-dispatch', name: 'Resource Dispatch Agent', progress: 45, findings: 'Analyzing nearest medical facilities and resource availability', icon: Users },
    { id: 'impact-forecast', name: 'Impact Forecast Agent', progress: 20, findings: 'Preparing geographic impact modeling based on incident parameters', icon: TrendingUp },
    { id: 'nlp-analysis', name: 'NLP Analysis Agent', progress: 0, findings: 'Extracting urgency indicators from witness statements', icon: Brain },
  ]

  const getStepStatus = (stepId: number) => {
    if (processingDone) return 'completed'
    if (animatedSteps.includes(stepId - 1)) {
      return animatedSteps.length > stepId ? 'completed' : 'active'
    }
    return 'pending'
  }

  const progressPercent = processingDone
    ? 100
    : Math.round((animatedSteps.length / 8) * 100)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-xl font-semibold">AI Processing Pipeline</h1>
          <div className="text-sm text-cyan-400">
            {processingDone ? '✓ Complete' : processingStarted ? 'Processing...' : `Step ${Math.min(animatedSteps.length + 1, 8)}/8`}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!processingStarted && !processingDone && (
          <p className="mb-6 text-sm text-muted-foreground text-center">
            Your report was submitted. AI analysis runs automatically — you can leave this page safely.
          </p>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card/30 backdrop-blur">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="text-cyan-400">⚙️</span>
                Processing Pipeline
              </h2>
              <div className="space-y-3">
                {processingSteps.map((step, idx) => {
                  const status = getStepStatus(step.id)
                  return (
                    <div key={step.id} className="relative">
                      {idx < processingSteps.length - 1 && (
                        <div className={`absolute left-6 top-12 w-0.5 h-8 transition-all duration-500 ${status === 'completed' ? 'bg-cyan-400' : 'bg-border'}`} />
                      )}
                      <div className={`flex gap-4 p-4 rounded-lg border transition-all duration-500 ${
                        status === 'completed' ? 'border-cyan-500/50 bg-cyan-500/10'
                          : status === 'active' ? 'border-cyan-500 bg-cyan-500/20 ring-1 ring-cyan-500/30'
                          : 'border-border bg-transparent'
                      }`}>
                        <div className="flex-shrink-0 flex items-center justify-center">
                          {status === 'completed' && <CheckCircle2 className="w-6 h-6 text-cyan-400" />}
                          {status === 'active' && <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400 animate-spin" />}
                          {status === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-border" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span className="font-medium">{step.label}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{step.duration}</span>
                          </div>
                          {status !== 'pending' && (
                            <div className="h-1 bg-border rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-700 ${status === 'active' ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 w-3/4' : 'bg-cyan-400 w-full'}`} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-cyan-400 font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-orange-400">🤖</span>
              AI Agents
            </h2>
            {agents.map(agent => {
              const Icon = agent.icon
              const isActive = activeAgent === agent.id && !processingDone
              const isCompleted = processingDone
              return (
                <div key={agent.id} className={`p-4 rounded-lg border transition-all duration-500 ${
                  isActive ? 'border-cyan-500 bg-cyan-500/20 ring-1 ring-cyan-500/30'
                    : isCompleted ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-border bg-card/30'
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm leading-tight">{agent.name}</h3>
                      <p className={`text-xs mt-1 ${isActive ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                        {isActive ? '🔄 Processing' : isCompleted ? '✓ Ready' : '⏱️ Queued'}
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
                    <div className={`h-full transition-all duration-500 ${isActive ? 'bg-gradient-to-r from-cyan-400 to-cyan-300' : 'bg-cyan-500'}`} style={{ width: `${isCompleted ? 100 : agent.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{agent.findings}</p>
                </div>
              )
            })}
          </div>
        </div>

        {incident && (
          <div className="mt-8 p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Live Incident Analysis
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="font-mono text-sm">{formatCoordinates(incident.latitude, incident.longitude)}</p>
              </div>
              <div className="p-3 rounded border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Severity</p>
                <p className="font-semibold text-orange-400">{formatSeverity(incident.severity)} - {formatIncidentType(incident.emergency_type)}</p>
              </div>
              <div className="p-3 rounded border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">Affected People</p>
                <p className="font-mono text-sm text-cyan-400">~{(incident.affected_people ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded border border-border bg-card/50">
                <p className="text-xs text-muted-foreground mb-1">AI Confidence</p>
                <p className="font-mono text-sm text-cyan-400">{incident.ai_confidence != null ? `${incident.ai_confidence}%` : 'Processing...'}</p>
              </div>
            </div>
            {processingDone && incident.email && (
              <p className="mt-4 text-sm text-cyan-300">
                A confirmation email has been sent to {incident.email}.
              </p>
            )}
          </div>
        )}

        {processingError && (
          <div className="mt-8 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Processing update</p>
              <p className="text-sm mt-1 text-amber-100/80">{processingError}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <Button
            className="bg-cyan-500 hover:bg-cyan-600 text-background"
            disabled={!processingDone && !processingError}
            onClick={() => router.push(`/incident/${incidentId}`)}
          >
            View Incident Details
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="border-border">View Command Center</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
