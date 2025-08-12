"use client";
import { PinContainer } from "./3d-pin";
import { Scan, BarChart3, Check, TrendingUp, Users } from "lucide-react";

export function BrainInkPinDemo() {
  return (
    <div className="h-[40rem] w-full flex items-center justify-center gap-8 bg-gradient-to-b from-sky-50 to-indigo-50/20">
      {/* Card 1: Instant Grading */}
      <PinContainer title="Try Instant Grading" href="/signup">
        <div className="flex flex-col p-6 tracking-tight text-slate-100/50 w-[20rem] h-[20rem] bg-gradient-to-b from-slate-800/50 to-slate-800/0 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Scan className="size-5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">Instant Grading</div>
              <div className="text-xs text-slate-400">Scan or upload handwritten/typed work and get results immediately</div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="flex-1 mt-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">1</div>
              <div>
                <div className="text-sm font-medium text-slate-200">TEST</div>
                <div className="text-xs text-slate-400">Handwritten or digital work</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">2</div>
              <div>
                <div className="text-sm font-medium text-slate-200">UPLOAD</div>
                <div className="text-xs text-slate-400">Scan or drag & drop to grade</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">3</div>
              <div>
                <div className="text-sm font-medium text-slate-200">RESULTS</div>
                <div className="text-xs text-slate-400">Breakdowns, strengths & next steps</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div className="text-xs text-slate-400">Live processing</div>
            </div>
            <div className="text-blue-400 text-sm font-medium">
              Start Now →
            </div>
          </div>
        </div>
      </PinContainer>

      {/* Card 2: Actionable Feedback */}
      <PinContainer title="View Feedback System" href="/signup">
        <div className="flex flex-col p-6 tracking-tight text-slate-100/50 w-[20rem] h-[20rem] bg-gradient-to-b from-slate-800/50 to-slate-800/0 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Check className="size-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">Actionable Feedback</div>
              <div className="text-xs text-slate-400">Breakdowns of strengths, gaps, and suggested follow-ups for each student</div>
            </div>
          </div>

          {/* Feedback Stats */}
          <div className="flex-1 mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-2xl font-bold text-emerald-400">94%</div>
                <div className="text-xs text-slate-400">Accuracy Rate</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">3.2s</div>
                <div className="text-xs text-slate-400">Avg Response</div>
              </div>
            </div>

            {/* Sample Feedback */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-200">Strengths</span>
                </div>
                <div className="text-xs text-slate-400">Strong algebra fundamentals</div>
              </div>
              
              <div className="p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-200">Areas to improve</span>
                </div>
                <div className="text-xs text-slate-400">Practice word problems</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-slate-400">
              Updated 2 min ago
            </div>
            <div className="text-emerald-400 text-sm font-medium">
              View Details →
            </div>
          </div>
        </div>
      </PinContainer>

      {/* Card 3: Student Dashboards */}
      <PinContainer title="Explore Analytics" href="/signup">
        <div className="flex flex-col p-6 tracking-tight text-slate-100/50 w-[20rem] h-[20rem] bg-gradient-to-b from-slate-800/50 to-slate-800/0 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <BarChart3 className="size-5 text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">Student Dashboards</div>
              <div className="text-xs text-slate-400">Individual progress, topics to review, and growth over time</div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="flex-1 mt-6 space-y-4">
            {/* Progress Chart Simulation */}
            <div className="p-4 rounded-lg bg-slate-700/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-200">Weekly Progress</span>
                <TrendingUp className="size-4 text-purple-400" />
              </div>
              
              {/* Animated Progress Bars */}
              <div className="space-y-2">
                {[
                  { subject: "Math", progress: 85, color: "bg-purple-400" },
                  { subject: "Science", progress: 72, color: "bg-blue-400" },
                  { subject: "English", progress: 91, color: "bg-emerald-400" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-12">{item.subject}</span>
                    <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 delay-${i * 200}`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300">{item.progress}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-slate-400" />
                <span className="text-sm text-slate-200">Class Rank</span>
              </div>
              <span className="text-lg font-bold text-purple-400">#3</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-slate-400">
              Last updated: Now
            </div>
            <div className="text-purple-400 text-sm font-medium">
              Full Report →
            </div>
          </div>
        </div>
      </PinContainer>
    </div>
  );
}
