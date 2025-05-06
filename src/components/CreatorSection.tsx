import React from 'react';
import { PixelButton } from './shared/PixelButton';
import { BookIcon, UserIcon, CheckCircleIcon, CoinsIcon } from 'lucide-react';
export const CreatorSection = () => {
  return <section className="min-h-screen w-full bg-dark py-20 relative overflow-hidden" id="creator">
      {/* Background decorations */}
      <div className="absolute inset-0 z-0 opacity-20">
        {/* Code-like patterns */}
        {Array.from({
        length: 10
      }).map((_, i) => <div key={i} className="absolute font-mono text-xs text-primary/30" style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 360}deg)`
      }}>
            {`function createQuest() { 
              return { 
                title: "New Quest", 
                xp: 100, 
                difficulty: "medium" 
              } 
            }`}
          </div>)}
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-pixel text-3xl md:text-4xl mb-4 text-primary">
            BUILD YOUR OWN <span className="text-secondary">QUEST</span>
          </h2>
          <p className="text-gray-300 font-pixel text-sm max-w-2xl mx-auto">
            Be a Teacher. Be a Legend.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Creator Tools */}
          <div className="w-full md:w-1/2">
            <div className="bg-dark/50 border-2 border-primary/30 rounded-lg p-6 h-full">
              <h3 className="font-pixel text-primary text-xl mb-6">
                Creator Tools
              </h3>
              <div className="space-y-6">
                {[{
                icon: <BookIcon size={24} className="text-primary" />,
                title: 'Course Creator',
                description: 'Build interactive courses with quizzes, videos, and challenges'
              }, {
                icon: <UserIcon size={24} className="text-secondary" />,
                title: 'Host Classes',
                description: 'Run live sessions with students and answer questions in real-time'
              }, {
                icon: <CheckCircleIcon size={24} className="text-tertiary" />,
                title: 'Verification System',
                description: 'Get verified as an expert and increase your content visibility'
              }, {
                icon: <CoinsIcon size={24} className="text-yellow-400" />,
                title: 'Earn INK Tokens',
                description: 'Get paid when students complete your courses or win your challenges'
              }].map((tool, i) => <div key={i} className="flex hover-scale cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-dark flex items-center justify-center mr-4 flex-shrink-0">
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className="font-pixel text-primary text-sm mb-1">
                        {tool.title}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {tool.description}
                      </p>
                    </div>
                  </div>)}
              </div>
              <div className="mt-8">
                <PixelButton primary>Start Creating</PixelButton>
              </div>
            </div>
          </div>
          {/* Course Preview */}
          <div className="w-full md:w-1/2">
            <div className="bg-dark/50 border-2 border-primary/30 rounded-lg overflow-hidden">
              {/* Course Header */}
              <div className="bg-primary/20 p-4 border-b border-primary/30">
                <div className="flex justify-between items-center">
                  <h3 className="font-pixel text-primary text-sm">
                    Physics 101: The Basics
                  </h3>
                  <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                    VERIFIED
                  </div>
                </div>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <UserIcon size={12} className="mr-1" />
                  <span>By PhysicsProf</span>
                  <span className="mx-2">•</span>
                  <span>4.9 ⭐ (120 ratings)</span>
                </div>
              </div>
              {/* Course Content Preview */}
              <div className="p-4">
                <div className="space-y-4">
                  {/* Module 1 */}
                  <div className="bg-dark border border-primary/20 p-3 rounded-lg">
                    <h4 className="font-pixel text-primary text-xs mb-2">
                      Module 1: Introduction
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-300 text-xs">
                        <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                          1
                        </div>
                        <span>What is Physics?</span>
                        <span className="ml-auto text-green-400">✓</span>
                      </div>
                      <div className="flex items-center text-gray-300 text-xs">
                        <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                          2
                        </div>
                        <span>Basic Terminology</span>
                        <span className="ml-auto text-green-400">✓</span>
                      </div>
                      <div className="flex items-center text-gray-300 text-xs">
                        <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                          3
                        </div>
                        <span>Quiz: Fundamentals</span>
                        <span className="ml-auto text-yellow-400">!</span>
                      </div>
                    </div>
                  </div>
                  {/* Module 2 */}
                  <div className="bg-dark border border-primary/20 p-3 rounded-lg">
                    <h4 className="font-pixel text-primary text-xs mb-2">
                      Module 2: Forces
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-300 text-xs">
                        <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                          1
                        </div>
                        <span>Newton's Laws</span>
                        <span className="ml-auto text-gray-500">🔒</span>
                      </div>
                      <div className="flex items-center text-gray-300 text-xs">
                        <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                          2
                        </div>
                        <span>Gravity and Weight</span>
                        <span className="ml-auto text-gray-500">🔒</span>
                      </div>
                      <div className="flex items-center text-gray-300 text-xs">
                        <div className="w-4 h-4 rounded-full bg-primary/20 mr-2 flex items-center justify-center text-[10px]">
                          3
                        </div>
                        <span>Interactive Lab: Forces</span>
                        <span className="ml-auto text-gray-500">🔒</span>
                      </div>
                    </div>
                  </div>
                  {/* Course Stats */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-secondary text-sm font-bold">
                          1,240
                        </div>
                        <div className="text-gray-400 text-xs">Students</div>
                      </div>
                      <div>
                        <div className="text-secondary text-sm font-bold">
                          8
                        </div>
                        <div className="text-gray-400 text-xs">Modules</div>
                      </div>
                      <div>
                        <div className="text-secondary text-sm font-bold">
                          620
                        </div>
                        <div className="text-gray-400 text-xs">INK Earned</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Course Actions */}
              <div className="p-4 border-t border-primary/30 bg-dark">
                <div className="flex justify-between items-center">
                  <div className="text-xs">
                    <span className="text-primary font-pixel">50 INK</span>
                    <span className="text-gray-400"> or </span>
                    <span className="text-secondary font-pixel">
                      Free Trial
                    </span>
                  </div>
                  <PixelButton primary small>
                    Enroll Now
                  </PixelButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};