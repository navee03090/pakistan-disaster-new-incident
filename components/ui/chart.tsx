'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_VARIABLE_PREFIX }
const THEMES = { light: '', dark: '.dark' }

export const ChartContext = React.createContext<{
  config: ChartConfig
} | null>(null)

function useChartContext() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    theme?: {
      light?: string
      dark?: string
    }
    icon?: React.ComponentType<{ className?: string }>
  } & (
    | { color?: string; pattern?: never }
    | { color?: never; pattern?: string }
  )
}

function ChartContainer(
  {
    id,
    className,
    children,
    config,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const uniqueId = React.useId()
  const chartId = `${id || uniqueId}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          'flex aspect-video justify-center text-xs',
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-axis_line]:stroke-border/50 [&_.recharts-curve]:stroke-[var(--color-primary)]',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}
ChartContainer.displayName = 'ChartContainer'

const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}>(ChartContainer)

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const cssVariables: Record<string, string> = {}

  for (const [key, itemConfig] of Object.entries(config)) {
    const label = typeof itemConfig === 'string' ? itemConfig : itemConfig.label

    if (itemConfig.theme) {
      for (const [theme, color] of Object.entries(itemConfig.theme)) {
        const cssVariable =
          `--color-${key}` as const

        cssVariables[`${THEMES[theme as keyof typeof THEMES]} [data-chart=${id}] ${cssVariable}`] = color
      }
    } else if ('color' in itemConfig && itemConfig.color) {
      cssVariables[`[data-chart=${id}] --color-${key}`] = itemConfig.color
    }
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(cssVariables)
          .map(([key, value]) => `${key} { ${value} }`)
          .join('\n'),
      }}
    />
  )
}
ChartStyle.displayName = 'ChartStyle'

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    Pick<RechartsPrimitive.TooltipProps, 'active' | 'payload' | 'label'> & {
      hideLabel?: boolean
      hideNameKey?: boolean
      indicator?: 'line' | 'dot' | 'dashed'
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      label,
      hideLabel = false,
      hideNameKey = false,
      indicator = 'dot',
      nameKey,
      labelKey,
      className,
      ...props
    },
    ref,
  ) => {
    const { config } = useChartContext()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload || payload.length === 0) {
        return null
      }

      const item = payload[0]
      const key = `${labelKey || 'value'}` as const
      const itemConfig = config[item.dataKey as string]
      const value = `${item[key]}`

      if (hideNameKey) {
        return value
      }

      return `${itemConfig?.label || item.dataKey}: ${value}`
    }, [config, hideNameKey, hideLabel, labelKey, payload])

    if (!active || !payload || payload.length === 0) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background/95 px-2.5 py-1.5 text-xs shadow-xl',
          className,
        )}
        {...props}
      >
        {!hideLabel ? <div className="text-muted-foreground">{tooltipLabel}</div> : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `color` as const
            const itemConfig = config[item.dataKey as string]
            const indicatorColor = `hsl(var(--color-${item.dataKey}))`

            return (
              <div
                key={`${item.dataKey}-${index}`}
                className="flex w-full flex-col gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  {indicator === 'dot' && (
                    <div
                      className="aspect-square h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                  {indicator === 'line' && (
                    <div
                      className="h-1 w-3"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />
                  )}
                  {indicator === 'dashed' && (
                    <div
                      className="h-1 w-3 border-t-2 border-dashed"
                      style={{
                        borderColor: item.color,
                      }}
                    />
                  )}
                  <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                </div>
                <span className="font-mono font-medium text-foreground">
                  {typeof item.value === 'string' && item.value.startsWith('$')
                    ? item.value
                    : `${item.value}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    Pick<RechartsPrimitive.LegendProps, 'payload'> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(({ className, hideIcon = false, payload, nameKey }, ref) => {
  const { config } = useChartContext()

  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-center justify-center gap-4', className)}
    >
      {payload.map((item) => {
        const key = `${nameKey || 'value'}` as const
        const itemConfig = config[item[key] as string]

        return (
          <div key={item[key]} className="flex items-center gap-1.5">
            {!hideIcon && (
              <div
                className="aspect-square h-2 w-2 rounded-full border border-primary"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = 'ChartLegendContent'

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
export type { ChartConfig }
