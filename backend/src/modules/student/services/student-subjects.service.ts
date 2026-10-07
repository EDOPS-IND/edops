import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentSubjectsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSubjects(organizationId: string, studentUserId: string) {
    const subjects = [
      {
        id: 'sub-math',
        name: 'Mathematics',
        code: 'MATH-10',
        teacher: 'Rahul Sharma',
        teacherEmail: 'rahul.sharma@school.edu',
        attendance: 95,
        assignmentsCompleted: 92,
        assessmentAverage: 84,
        curriculumProgress: 88,
        learningOutcomesAchieved: 14,
        totalLearningOutcomes: 16,
        color: 'indigo',
        currentTopic: 'Quadratic Equations - Nature of Roots',
      },
      {
        id: 'sub-sci',
        name: 'Science (Physics, Chemistry, Bio)',
        code: 'SCI-10',
        teacher: 'Priya Nair',
        teacherEmail: 'priya.nair@school.edu',
        attendance: 91,
        assignmentsCompleted: 88,
        assessmentAverage: 88,
        curriculumProgress: 82,
        learningOutcomesAchieved: 12,
        totalLearningOutcomes: 15,
        color: 'emerald',
        currentTopic: 'Chemical Reactions and Equations',
      },
      {
        id: 'sub-eng',
        name: 'English Language & Literature',
        code: 'ENG-10',
        teacher: 'Anita Roy',
        teacherEmail: 'anita.roy@school.edu',
        attendance: 96,
        assignmentsCompleted: 95,
        assessmentAverage: 79,
        curriculumProgress: 91,
        learningOutcomesAchieved: 11,
        totalLearningOutcomes: 12,
        color: 'blue',
        currentTopic: 'First Flight: A Triumph of Surgery',
      },
      {
        id: 'sub-soc',
        name: 'Social Science',
        code: 'SST-10',
        teacher: 'Vikram Joshi',
        teacherEmail: 'vikram.joshi@school.edu',
        attendance: 92,
        assignmentsCompleted: 90,
        assessmentAverage: 81,
        curriculumProgress: 80,
        learningOutcomesAchieved: 10,
        totalLearningOutcomes: 14,
        color: 'amber',
        currentTopic: 'The Rise of Nationalism in Europe',
      },
      {
        id: 'sub-hin',
        name: 'Hindi Course A',
        code: 'HIN-10',
        teacher: 'Meenakshi Sundaram',
        teacherEmail: 'meenakshi.s@school.edu',
        attendance: 94,
        assignmentsCompleted: 92,
        assessmentAverage: 83,
        curriculumProgress: 85,
        learningOutcomesAchieved: 9,
        totalLearningOutcomes: 11,
        color: 'rose',
        currentTopic: 'Kshitij: Surdas ke Pad',
      },
      {
        id: 'sub-cs',
        name: 'Computer Applications',
        code: 'CS-10',
        teacher: 'Deepak Verma',
        teacherEmail: 'deepak.v@school.edu',
        attendance: 98,
        assignmentsCompleted: 96,
        assessmentAverage: 91,
        curriculumProgress: 94,
        learningOutcomesAchieved: 8,
        totalLearningOutcomes: 8,
        color: 'purple',
        currentTopic: 'Cyber Ethics & Python Basics',
      },
    ];

    return { subjects };
  }
}
