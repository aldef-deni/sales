export type Severity = 'critical' | 'warning' | 'opportunity' | 'positive'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'owner' | 'manager' | 'sales'
  phone: string | null
  can_see_all_team_data: boolean
  tenant: { id: number; name: string; plan: string; currency: string }
}

export interface Insight {
  key: string
  severity: Severity
  title: string
  narrative: string
  action: string
  metrics?: Record<string, unknown>
  evidence?: Record<string, unknown>[]
  link?: string
}

export interface PipelineStage {
  stage: string
  label: string
  deal_count: number
  total_value: number
  weighted_value: number
}

export interface TrendPoint {
  period: string
  label: string
  revenue: number
  target: number
  is_partial: boolean
}

export interface LeadSource {
  source: string
  label: string
  total: number
  converted: number
  qualified: number
  conversion_rate: number
  estimated_value: number
}

export interface RepPerformance {
  user_id: number
  name: string
  revenue: number
  target: number
  attainment: number | null
  win_rate: number | null
  closed_deals: number
  won_deals: number
  recent_win_rate: number | null
  recent_deals: number
  prior_win_rate: number | null
  prior_deals: number
  open_pipeline: number
}

export interface Dashboard {
  period: { label: string; progress_pct: number; days_left: number }
  scope: 'team' | 'personal'
  headline: {
    revenue: number
    target: number
    attainment_pct: number | null
    expected_by_now: number
    vs_last_month_pct: number | null
    weighted_pipeline: number
    open_deals: number
    avg_deal_size: number
    outstanding_commission: number
    commission_this_month: number
  }
  insights: Insight[]
  pipeline: PipelineStage[]
  revenue_trend: TrendPoint[]
  lead_sources: LeadSource[]
  team: RepPerformance[]
}

export interface DealRow {
  id: number
  title: string
  customer: string | null
  owner: string | null
  owner_id: number | null
  value: number
  stage: string
  stage_label: string
  probability: number
  weighted_value: number
  expected_close_date: string | null
  lost_reason: string | null
  days_in_stage: number
  normal_days_in_stage: number
  is_stalled: boolean
  is_overdue: boolean
}

export interface BoardColumn {
  stage: string
  label: string
  is_closed: boolean
  probability: number
  deal_count: number
  total_value: number
  weighted_value: number
  deals: DealRow[]
}

export interface Board {
  columns: BoardColumn[]
  closed_window_days: number
  can_move_others: boolean
}

export interface LeadRow {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  city: string | null
  source: string
  source_label: string
  status: string
  score: number
  score_reasons: { factor: string; impact: number }[]
  estimated_value: number
  assignee: string | null
  age_days: number
  last_contacted_at: string | null
  is_untouched: boolean
}
