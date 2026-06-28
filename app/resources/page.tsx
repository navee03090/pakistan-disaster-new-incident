'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Edit2, Trash2, MapPin, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchResources, fetchDeployments, type Resource, type ResourceDeployment } from '@/lib/supabase/queries'
import { useSupabaseRealtime } from '@/lib/hooks/use-supabase-realtime'
import { formatIncidentId } from '@/lib/format'

export default function ResourceManagementCenter() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [resourceTypes, setResourceTypes] = useState<Resource[]>([])
  const [deployedResources, setDeployedResources] = useState<ResourceDeployment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newResource, setNewResource] = useState({ type: '', total: '', icon: '🚑' })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [resourcesRes, deploymentsRes] = await Promise.all([
      fetchResources(supabase),
      fetchDeployments(supabase),
    ])
    setResourceTypes(resourcesRes.data)
    setDeployedResources(deploymentsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useSupabaseRealtime(['resources', 'resource_deployments'], loadData)

  const handleAddResource = async () => {
    if (!newResource.type || !newResource.total) return
    const supabase = createClient()
    const total = parseInt(newResource.total, 10)
    await supabase.from('resources').insert({
      type: newResource.type,
      total,
      available: total,
      deployed: 0,
      icon: newResource.icon,
      status: 'Operational',
    })
    setNewResource({ type: '', total: '', icon: '🚑' })
    setShowAddForm(false)
    loadData()
  }

  const handleDeleteResource = async (id: string) => {
    const supabase = createClient()
    await supabase.from('resources').delete().eq('id', id)
    loadData()
  }

  const handleDeleteDeployment = async (id: string) => {
    const supabase = createClient()
    await supabase.from('resource_deployments').delete().eq('id', id)
    loadData()
  }

  const totalResources = resourceTypes.reduce((sum, r) => sum + r.total, 0)
  const activeDeployments = deployedResources.filter(d => d.deployment_status === 'Active').length
  const enRoute = deployedResources.filter(d => d.deployment_status === 'En Route').length

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Resource Management</h1>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-background flex items-center gap-2" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAddForm && (
          <div className="mb-8 p-6 rounded-lg border border-cyan-500/30 bg-card/30 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm mb-1 block">Type</label>
              <Input value={newResource.type} onChange={e => setNewResource(p => ({ ...p, type: e.target.value }))} placeholder="Ambulances" className="bg-card border-border" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Total Units</label>
              <Input type="number" value={newResource.total} onChange={e => setNewResource(p => ({ ...p, total: e.target.value }))} placeholder="10" className="bg-card border-border" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Icon</label>
              <Input value={newResource.icon} onChange={e => setNewResource(p => ({ ...p, icon: e.target.value }))} className="bg-card border-border w-20" />
            </div>
            <Button onClick={handleAddResource} className="bg-cyan-500 hover:bg-cyan-600 text-background">Save to Supabase</Button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading resources...</p>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Resource Inventory</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resourceTypes.map(resource => (
                  <div
                    key={resource.id}
                    onClick={() => setSelectedResource(resource.type)}
                    className={`p-6 rounded-lg border transition-all cursor-pointer ${
                      selectedResource === resource.type
                        ? 'border-cyan-500 bg-cyan-500/20 ring-1 ring-cyan-500/30'
                        : 'border-border bg-card/30 hover:bg-card/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-3xl">{resource.icon}</div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-semibold px-2 py-1 rounded text-cyan-400">{resource.status}</span>
                        <button onClick={e => { e.stopPropagation(); handleDeleteResource(resource.id) }} className="p-1 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-3">{resource.type}</h3>
                    <div className="space-y-2 mb-4 pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Available</span>
                        <span className="font-mono text-sm font-semibold text-cyan-400">{resource.available}/{resource.total}</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300" style={{ width: `${resource.total > 0 ? (resource.available / resource.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      {resource.deployed} deployed
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card/30">
              <h2 className="text-lg font-semibold mb-6">Active Deployments</h2>
              {deployedResources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active deployments. Deployments are created during AI processing.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Unit</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Crew</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Assignment</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployedResources.map(resource => (
                        <tr key={resource.id} className="border-b border-border hover:bg-card/50 transition">
                          <td className="py-4 px-4">
                            <div className="font-semibold">{resource.resource_type}</div>
                            <div className="text-xs text-muted-foreground">{resource.unit_code}</div>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              {resource.location ?? '—'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              resource.deployment_status === 'Active' ? 'bg-green-500/20 text-green-400'
                                : resource.deployment_status === 'En Route' ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {resource.deployment_status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-xs">
                              <Users className="w-3 h-3" />
                              {resource.crew ?? '—'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {resource.incident_id ? (
                              <Link href={`/incident/${resource.incident_id}`} className="text-cyan-400 hover:text-cyan-300 text-xs font-mono">
                                {formatIncidentId(resource.incident_id)}
                              </Link>
                            ) : '—'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button onClick={() => handleDeleteDeployment(resource.id)} className="p-1 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-8 grid md:grid-cols-4 gap-4">
              {[
                { label: 'Total Resources', value: String(totalResources), icon: Users },
                { label: 'Active Deployment', value: `${activeDeployments} units`, icon: CheckCircle2 },
                { label: 'En Route', value: `${enRoute} units`, icon: Clock },
                { label: 'Resource Types', value: String(resourceTypes.length), icon: AlertCircle },
              ].map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div key={idx} className="p-4 rounded-lg border border-border bg-card/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-cyan-400" />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
