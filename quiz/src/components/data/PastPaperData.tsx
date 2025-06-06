
export const pastPapersByExamBody = {
  WAEC: {
    Mathematics: {
      2023: [{
        id: 'waec-math-2023-1',
        title: 'WAEC Mathematics 2023',
        examBody: 'WAEC',
        subject: 'Mathematics',
        year: 2023,
        pdfUrl: 'https://kuulchat.com/wassce/papers/wassce%202023%20mathematics.pdf',
        description: 'WASSCE (WAEC) Mathematics examination paper from 2023.',
        pages: 15
      }],
      2022: [{
        id: 'waec-math-2022-1',
        title: 'WAEC Mathematics (Core) Paper 2 2022',
        examBody: 'WAEC',
        subject: 'Mathematics',
        year: 2022,
        pdfUrl: 'https://www.stevkons.com/wp-content/uploads/2022/08/Core-Maths-2022-P2.pdf',
        description: 'WASSCE (WAEC) Mathematics (Core) Paper 2 from 2022.',
        pages: 10
      }]
    },
    Physics: {
      2023: [{
        id: 'waec-physics-2023-2',
        title: 'WASSCE Physics Paper 2 2023',
        examBody: 'WAEC',
        subject: 'Physics',
        year: 2023,
        pdfUrl: 'https://poscholars.com/download/wassce_waec_2023_physics_paper_2_past_questions_and_answers_pdf.pdf',
        description: 'WASSCE (WAEC) Physics Paper 2 (theory/essay) from 2023.',
        pages: 8 // Estimated
      }],
      2020: [{
        id: 'waec-physics-2020-1',
        title: 'WASSCE Physics 2020',
        examBody: 'WAEC',
        subject: 'Physics',
        year: 2020,
        pdfUrl: 'https://kuulchat.com/wassce/papers/wassce%202020%20physics.pdf',
        description: 'WASSCE (WAEC) Physics examination paper from 2020.',
        pages: 10 // Estimated
      }]
    }
  },
  NECO: {
    Mathematics: {
      2023: [{
        id: 'neco-math-2023-1',
        title: 'NECO Mathematics 2023',
        examBody: 'NECO',
        subject: 'Mathematics',
        year: 2023,
        pdfUrl: 'https://acadanow.com/wp-content/uploads/2023/03/neco-mathematics-past-questions.pdf',
        description: 'NECO Mathematics past questions and answers compilation (2023).',
        pages: 20
      }]
    }
  }
};
// Flatten structure for compatibility
export const pastPapers = Object.entries(pastPapersByExamBody).flatMap(([_examBody, subjects]) => Object.entries(subjects).flatMap(([_subject, years]) => Object.entries(years).flatMap(([_year, papers]) => papers)));
export default pastPapers;