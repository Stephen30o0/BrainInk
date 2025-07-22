import React from 'react';

export const TeamSection = () => {
  const team = [
    {
      name: 'Mambuba Sumba Branis',
      title: 'Chief Technical Officer (CTO)',
      image: '/teampics/Branis.jpg',
      bio: 'Leading technological innovation and development at Brain Ink.',
    },
    {
      name: 'Liata Ornella Sifa',
      title: 'Chief Executive Officer (CEO)',
      image: '/teampics/Liata.jpg',
      bio: 'Driving the vision and strategic direction of Brain Ink.',
    },
    {
      name: 'Gitego Ange Kevine',
      title: 'Chief Operations Officer (COO)',
      image: '/teampics/Ange.jpg',
      bio: 'Ensuring operational excellence and seamless execution.',
    }
  ];

  return (
    <section className="py-24 bg-white" id="team">
      <div className="max-w-6xl mx-auto px-6">
        {/* Simple Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-light text-slate-900 mb-4">
            Meet Our Team
          </h2>
          <p className="text-xl text-slate-500 font-light">
            The visionary leaders driving innovation in educational technology
          </p>
        </div>

        {/* Clean Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <div key={index} className="text-center">
              {/* Simple Profile Image */}
              <div className="w-32 h-32 mx-auto mb-6">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              <h3 className="text-xl text-slate-900 mb-2">{member.name}</h3>
              <p className="text-blue-600 font-medium mb-4">{member.title}</p>
              <p className="text-slate-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>

        {/* Simple CTA */}
        <div className="text-center mt-20">
          <button 
            onClick={() => window.location.href = '/signup'}
            className="bg-blue-600 text-white px-12 py-4 text-lg font-light hover:bg-blue-700 transition-colors"
          >
            Join Our Mission
          </button>
        </div>
      </div>
    </section>
  );
};