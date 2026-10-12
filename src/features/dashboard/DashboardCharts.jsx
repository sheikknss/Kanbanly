import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Lazy-loaded (see dashboard route): recharts is large, so it is split into
 * its own chunk and only downloaded when the dashboard is visited.
 */
const PRIORITY_FILL = {
  low: "var(--priority-low)",
  medium: "var(--priority-medium)",
  high: "var(--priority-high)",
  urgent: "var(--priority-urgent)",
};
const STATUS_FILL = ["var(--chart-2)", "var(--chart-4)", "var(--chart-1)", "var(--chart-3)", "var(--chart-5)"];
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" };

export default function DashboardCharts({ byPriority, byStatus }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <figure className="rounded-xl border bg-card p-5">
        <figcaption className="eyebrow mb-4">Tasks by priority</figcaption>
        <div className="h-56" role="img" aria-label={byPriority.map((d) => `${d.name}: ${d.value}`).join(", ")}>
          <ResponsiveContainer>
            <BarChart data={byPriority}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} stroke="var(--muted-foreground)" />
              <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byPriority.map((d) => <Cell key={d.name} fill={PRIORITY_FILL[d.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure className="rounded-xl border bg-card p-5">
        <figcaption className="eyebrow mb-4">Tasks by status</figcaption>
        <div className="flex h-56 items-center gap-4" role="img" aria-label={byStatus.map((d) => `${d.name}: ${d.value}`).join(", ")}>
          <div className="h-full flex-1">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {byStatus.map((d, i) => <Cell key={d.name} fill={STATUS_FILL[i % STATUS_FILL.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 text-sm">
            {byStatus.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm" style={{ background: STATUS_FILL[i % STATUS_FILL.length] }} aria-hidden />
                {d.name} <span className="font-mono text-muted-foreground">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </figure>
    </div>
  );
}
