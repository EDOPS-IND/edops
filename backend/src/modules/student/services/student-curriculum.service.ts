import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentCurriculumService {
  constructor(private readonly dataSource: DataSource) {}

  async getCurriculum(organizationId: string, studentUserId: string) {
    const overallProgress = 86.0;

    const subjects = [
      {
        subject: 'Mathematics',
        code: 'MATH-10',
        progress: 88.0,
        chapters: [
          { number: 1, title: 'Real Numbers & Fundamental Theorem of Arithmetic', status: 'Completed', progress: 100 },
          { number: 2, title: 'Polynomials (Geometrical Meaning of Zeroes)', status: 'Completed', progress: 100 },
          { number: 3, title: 'Pair of Linear Equations in Two Variables', status: 'Completed', progress: 100 },
          { number: 4, title: 'Quadratic Equations & Nature of Roots', status: 'In Progress', progress: 75, remainingTopics: 'Word problems on speed and distance' },
          { number: 5, title: 'Arithmetic Progressions', status: 'In Progress', progress: 40, remainingTopics: 'Sum of first n terms' },
          { number: 6, title: 'Triangles & Similarity Theorems', status: 'Not Started', progress: 0, remainingTopics: 'Basic Proportionality Theorem' },
          { number: 7, title: 'Coordinate Geometry', status: 'Not Started', progress: 0, remainingTopics: 'Distance & Section formulas' },
        ],
      },
      {
        subject: 'Science',
        code: 'SCI-10',
        progress: 82.0,
        chapters: [
          { number: 1, title: 'Chemical Reactions and Equations', status: 'Completed', progress: 100 },
          { number: 2, title: 'Acids, Bases and Salts', status: 'Completed', progress: 100 },
          { number: 3, title: 'Metals and Non-metals', status: 'In Progress', progress: 60, remainingTopics: 'Extraction of metals and corrosion' },
          { number: 4, title: 'Life Processes (Nutrition & Respiration)', status: 'In Progress', progress: 50, remainingTopics: 'Transportation in human beings' },
          { number: 5, title: 'Light - Reflection and Refraction', status: 'Not Started', progress: 0, remainingTopics: 'Ray diagrams & lens formula' },
        ],
      },
      {
        subject: 'English',
        code: 'ENG-10',
        progress: 91.0,
        chapters: [
          { number: 1, title: 'A Letter to God (G.L. Fuentes)', status: 'Completed', progress: 100 },
          { number: 2, title: 'Nelson Mandela: Long Walk to Freedom', status: 'Completed', progress: 100 },
          { number: 3, title: 'Two Stories about Flying', status: 'In Progress', progress: 80, remainingTopics: 'Black Aeroplane critical commentary' },
          { number: 4, title: 'From the Diary of Anne Frank', status: 'Not Started', progress: 0, remainingTopics: 'Full chapter text analysis' },
        ],
      },
    ];

    return { overallProgress, subjects };
  }
}
