import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, ArrowRight } from 'lucide-react';
import MarketingHeader from '../components/marketing/MarketingHeader';
import MarketingFooter from '../components/marketing/MarketingFooter';

const GetStarted: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <MarketingHeader />
      
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Join BrainInk
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose how you'd like to get started with our AI-powered learning platform
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* School Card */}
            <Link
              to="/school-login"
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-300 hover:-translate-y-1"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Join as School
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Set up your institution with BrainInk. Manage teachers, students, and get comprehensive analytics for your entire school system.
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  <li className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                    Teacher and student management
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                    School-wide analytics dashboard
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                    Administrative control panel
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-semibold group-hover:text-blue-700">
                    Get started as school
                  </span>
                  <ArrowRight className="w-5 h-5 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Link>

            {/* Student Card */}
            <Link
              to="/signup"
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-purple-300 hover:-translate-y-1"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Join as Student
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Start your personalized learning journey. Access assignments, get AI-powered feedback, and track your academic progress.
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  <li className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                    Personalized learning dashboard
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                    AI-powered study assistance
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                    Progress tracking and analytics
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 font-semibold group-hover:text-purple-700">
                    Get started as student
                  </span>
                  <ArrowRight className="w-5 h-5 text-purple-600 group-hover:text-purple-700 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-16">
            <p className="text-slate-500 text-sm">
              Need help choosing? <Link to="/help" className="text-blue-600 hover:text-blue-700 font-medium">Contact our support team</Link>
            </p>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
};

export default GetStarted;
