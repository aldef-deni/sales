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

export type LeadPriority = 'hot' | 'warm' | 'cold'

export interface ScoreReason {
  factor: string
  impact: number
  detail?: string | null
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
  status_label: string
  score: number
  priority: LeadPriority
  priority_label: string
  estimated_value: number
  assignee: string | null
  assigned_to: number | null
  age_days: number
  last_contacted_at: string | null
  next_follow_up_at: string | null
  follow_up_due: boolean
  follow_up_count: number
  is_untouched: boolean
  response_hours: number | null
  lost_reason: string | null
  lost_reason_category: string | null
  converted_customer_id: number | null
}

export interface LeadDetail extends LeadRow {
  notes: string | null
  score_reasons: ScoreReason[]
  scored_at: string | null
  has_budget: boolean | null
  is_decision_maker: boolean | null
  need_level: string | null
  timeline: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

export interface LeadSummary {
  open: number
  hot: number
  follow_up_due: number
  untouched: number
  open_value: number
  duplicates_merged: number
  duplicates_flagged: number
  avg_response_hours: number | null
}

export interface ChannelOption {
  value: string
  label: string
  automatic: boolean
  total: number
}

export interface LeadListResponse {
  data: LeadRow[]
  summary: LeadSummary
  channels: ChannelOption[]
  statuses: { value: string; label: string }[]
}

export interface TimelineEntry {
  type: string
  at: string
  title: string
  note: string | null
  by: string | null
}

export interface LeadDetailResponse {
  lead: LeadDetail
  timeline: TimelineEntry[]
  possible_duplicates: { id: number; name: string; company: string | null; phone: string | null; email: string | null; status: string }[]
  merged_duplicates: { id: number; name: string; company: string | null; source: string; created_at: string }[]
  loss_categories: { value: string; label: string }[]
}

export interface ChannelPerformance {
  channel: string
  label: string
  total: number
  share_pct: number
  qualified: number
  converted: number
  failed: number
  conversion_rate: number
  converted_value: number
  value_per_lead: number
  avg_score: number
  avg_response_hours: number | null
  is_significant: boolean
}

export interface FunnelStep {
  status: string
  label: string
  currently_here: number
  reached: number
  reach_pct: number
  avg_hours_here: number | null
}

export interface LeadAnalytics {
  summary: LeadSummary
  channels: ChannelPerformance[]
  funnel: FunnelStep[]
  loss_categories: { category: string; label: string; total: number; share_pct: number; lost_value: number }[]
  loss_by_channel: { label: string; top_reason: string | null; top_reason_count: number; total: number }[]
  response_speed: { label: string; total: number; converted: number; conversion_rate: number; is_significant: boolean }[]
  intake_trend: { date: string; label: string; created: number; merged: number; rejected: number }[]
}

export interface Forecast {
  period: string
  days_left: number
  target: number
  booked: number
  range: { low: number; likely: number; high: number }
  attainment_likely_pct: number | null
  gap_to_target: number
  will_hit_target: boolean
  components: Record<string, { label: string; amount: number; basis: string }>
  narrative: string
  stage_win_rates: Record<string, { reached: number; won: number; rate: number; is_measured: boolean }>
}
