import { cn } from "@/lib/utils";
import { Scan, ClipboardList, FileCheck2, BarChart3, Files, Shield, GraduationCap, Users } from "lucide-react";

export function BrainInkCapabilities() {
  const features = [
    {
      title: "Scan & grade quickly",
      description:
        "Batch scan stacks of papers or upload photos from a phone. AI reads handwriting and structured answers, returning marks and preliminary feedback instantly—hours saved every week.",
      icon: <Scan className="w-full h-full" />,
    },
    {
      title: "Rubrics & consistency",
      description:
        "Import or build rubrics once; apply everywhere. Standardized criteria make marking fair across parallel classes and subjects.",
      icon: <ClipboardList className="w-full h-full" />,
    },
    {
      title: "Detailed feedback",
      description:
        "Students (and parents) see strengths, misconceptions, and next‑step recommendations—turning raw marks into learning momentum.",
      icon: <FileCheck2 className="w-full h-full" />,
    },
    {
      title: "Dashboards & analytics",
      description:
        "Live class and school views surface trends early: topic gaps, outliers, and emerging excellence—support data‑driven interventions.",
      icon: <BarChart3 className="w-full h-full" />,
    },
    {
      title: "Records & credentials",
      description:
        "Tamper‑evident storage of assessment history. Export term reports or transcripts and maintain secure longitudinal student profiles.",
      icon: <Files className="w-full h-full" />,
    },
    {
      title: "Privacy by design",
      description:
        "Minimal data footprint, principle of least privilege, full encryption in transit & at rest—aligned with emerging African data regulations.",
      icon: <Shield className="w-full h-full" />,
    },
    {
      title: "Student empowerment",
      description:
        "Students gain clear insights into their learning journey with personalized feedback and progress tracking.",
      icon: <GraduationCap className="w-full h-full" />,
    },
    {
      title: "Teacher efficiency",
      description:
        "Save 10+ hours per week with automated grading while maintaining the personal touch in education.",
      icon: <Users className="w-full h-full" />,
    },
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h5 className="text-xs uppercase tracking-wide text-slate-600 mb-3 sm:mb-4">BrainInk capabilities</h5>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 mb-4 sm:mb-5 md:mb-6">
            What you can do with{" "}
            <span className="text-blue-500">BrainInk</span>
          </h2>
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed px-4 sm:px-0">
            The platform brings speed, consistency, and insight to everyday assessment.
            Explore the core capabilities teachers, students, and school leaders rely on daily.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10 py-6 sm:py-8 md:py-10">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-6 sm:py-8 md:py-10 relative group/feature border-slate-200",
        (index === 0 || index === 4) && "lg:border-l border-slate-200",
        index < 4 && "lg:border-b border-slate-200"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-blue-50 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      )}
      <div className="mb-3 sm:mb-4 relative z-10 px-6 sm:px-8 md:px-10 text-blue-600">
        <div className="w-5 h-5 sm:w-6 sm:h-6">
          {icon}
        </div>
      </div>
      <div className="text-base sm:text-lg font-bold mb-2 relative z-10 px-6 sm:px-8 md:px-10">
        <div className="absolute left-0 inset-y-0 h-5 sm:h-6 group-hover/feature:h-6 sm:group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-slate-300 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-stone-900">
          {title}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-slate-600 max-w-xs relative z-10 px-6 sm:px-8 md:px-10">
        {description}
      </p>
    </div>
  );
};

export default BrainInkCapabilities
