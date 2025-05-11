import React from 'react';
import { PastPaper } from '../../lib/types';
export const pastPapersByExamBody = {
  WAEC: {
    Mathematics: {
      2023: [{
        id: 'waec-math-2023-1',
        title: 'WAEC Mathematics 2023',
        examBody: 'WAEC',
        subject: 'Mathematics',
        year: 2023,
        pdfUrl: 'https://example.com/waec-mathematics-2023.pdf',
        description: 'Complete mathematics examination paper for WAEC 2023',
        pages: 12
      }],
      2022: [{
        id: 'waec-math-2022-1',
        title: 'WAEC Mathematics 2022',
        examBody: 'WAEC',
        subject: 'Mathematics',
        year: 2022,
        pdfUrl: 'https://example.com/waec-mathematics-2022.pdf',
        description: 'Complete mathematics examination paper for WAEC 2022',
        pages: 10
      }]
    },
    Physics: {
      2023: [{
        id: 'waec-physics-2023-1',
        title: 'WAEC Physics 2023',
        examBody: 'WAEC',
        subject: 'Physics',
        year: 2023,
        pdfUrl: 'https://example.com/waec-physics-2023.pdf',
        description: 'Complete physics examination paper for WAEC 2023',
        pages: 15
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
        pdfUrl: 'https://example.com/neco-mathematics-2023.pdf',
        description: 'Complete mathematics examination paper for NECO 2023',
        pages: 14
      }]
    }
  }
};
// Flatten structure for compatibility
export const pastPapers = Object.entries(pastPapersByExamBody).flatMap(([examBody, subjects]) => Object.entries(subjects).flatMap(([subject, years]) => Object.entries(years).flatMap(([year, papers]) => papers)));
export default pastPapers;