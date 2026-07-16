import { Brain, Target, RefreshCw, Box } from "lucide-react";

export default function OverviewSection() {
  const benefits = [
    {
      id: "01",
      title: "All the context, instantly.",
      description:
        "Gives Claude all the relevant information it needs about you without you ever having to explain yourself again.",
      icon: Brain,
      color: "text-emerald-400",
    },
    {
      id: "02",
      title: "Always indexed. Always up-to-date.",
      description:
        "Every context is indexed so Claude knows exactly what to retrieve for which question.",
      icon: Target,
      color: "text-cyan-400",
    },
    {
      id: "03",
      title: "Auto-updating. Effortless.",
      description:
        "Auto-updating keeps everything current at all times without you manually updating anything.",
      icon: RefreshCw,
      color: "text-[#10b981]",
    },
    {
      id: "04",
      title: "Clean overview. 10x productivity.",
      description:
        "Pair it with Obsidian to get a clean overview of your context and your productivity goes up 10x.",
      icon: Box,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-white/10">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        return (
          <div
            key={benefit.id}
            className="group relative bg-[#0D0D0D] hover:bg-[#141414] border border-white/10 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-white/5 hover:-translate-y-0.5"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />

            <div className="flex items-start gap-4">
              {/* Number Prefix & Icon */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-white/30 group-hover:text-white">
                  {benefit.id}
                </span>
                <div className="p-2 rounded-lg bg-[#0A0A0A] border border-white/10 text-white group-hover:border-white/30 transition-colors duration-300">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white/90 tracking-tight group-hover:text-white transition-colors">
                  {benefit.title}
                </h4>
                <p className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                  {benefit.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
