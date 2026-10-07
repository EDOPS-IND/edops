import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class StudentTimetableService {
  constructor(private readonly dataSource: DataSource) {}

  async getTimetable(organizationId: string, studentUserId: string) {
    const weeklySchedule: Record<string, any[]> = {
      monday: [
        { period: 1, time: '09:00 - 09:45', subject: 'Mathematics', teacher: 'Rahul Sharma', room: 'A-204' },
        { period: 2, time: '09:45 - 10:30', subject: 'Science', teacher: 'Priya Nair', room: 'A-205' },
        { period: 3, time: '10:45 - 11:30', subject: 'English', teacher: 'Anita Roy', room: 'A-104' },
        { period: 4, time: '11:30 - 12:15', subject: 'Social Science', teacher: 'Vikram Joshi', room: 'A-108' },
        { period: 5, time: '01:00 - 01:45', subject: 'Computer Science', teacher: 'Deepak Verma', room: 'Lab-1' },
        { period: 6, time: '01:45 - 02:30', subject: 'Hindi', teacher: 'Meenakshi S.', room: 'A-204' },
      ],
      tuesday: [
        { period: 1, time: '09:00 - 09:45', subject: 'Science', teacher: 'Priya Nair', room: 'A-205' },
        { period: 2, time: '09:45 - 10:30', subject: 'Mathematics', teacher: 'Rahul Sharma', room: 'A-204' },
        { period: 3, time: '10:45 - 11:30', subject: 'Social Science', teacher: 'Vikram Joshi', room: 'A-108' },
        { period: 4, time: '11:30 - 12:15', subject: 'English', teacher: 'Anita Roy', room: 'A-104' },
        { period: 5, time: '01:00 - 01:45', subject: 'Physical Education', teacher: 'Captain Singh', room: 'Ground' },
        { period: 6, time: '01:45 - 02:30', subject: 'Mathematics Remedial', teacher: 'Rahul Sharma', room: 'A-204' },
      ],
      wednesday: [
        { period: 1, time: '09:00 - 09:45', subject: 'Mathematics', teacher: 'Rahul Sharma', room: 'A-204' },
        { period: 2, time: '09:45 - 10:30', subject: 'Computer Science', teacher: 'Deepak Verma', room: 'Lab-1' },
        { period: 3, time: '10:45 - 11:30', subject: 'Science Lab', teacher: 'Priya Nair', room: 'Science Lab' },
        { period: 4, time: '11:30 - 12:15', subject: 'Science Lab', teacher: 'Priya Nair', room: 'Science Lab' },
        { period: 5, time: '01:00 - 01:45', subject: 'Hindi', teacher: 'Meenakshi S.', room: 'A-204' },
        { period: 6, time: '01:45 - 02:30', subject: 'Social Science', teacher: 'Vikram Joshi', room: 'A-108' },
      ],
      thursday: [
        { period: 1, time: '09:00 - 09:45', subject: 'English', teacher: 'Anita Roy', room: 'A-104' },
        { period: 2, time: '09:45 - 10:30', subject: 'Mathematics', teacher: 'Rahul Sharma', room: 'A-204' },
        { period: 3, time: '10:45 - 11:30', subject: 'Science', teacher: 'Priya Nair', room: 'A-205' },
        { period: 4, time: '11:30 - 12:15', subject: 'Hindi', teacher: 'Meenakshi S.', room: 'A-204' },
        { period: 5, time: '01:00 - 01:45', subject: 'Social Science', teacher: 'Vikram Joshi', room: 'A-108' },
        { period: 6, time: '01:45 - 02:30', subject: 'Art & Craft', teacher: 'Suman Roy', room: 'Art Studio' },
      ],
      friday: [
        { period: 1, time: '09:00 - 09:45', subject: 'Mathematics', teacher: 'Rahul Sharma', room: 'A-204' },
        { period: 2, time: '09:45 - 10:30', subject: 'Science', teacher: 'Priya Nair', room: 'A-205' },
        { period: 3, time: '10:45 - 11:30', subject: 'Social Science', teacher: 'Vikram Joshi', room: 'A-108' },
        { period: 4, time: '11:30 - 12:15', subject: 'English', teacher: 'Anita Roy', room: 'A-104' },
        { period: 5, time: '01:00 - 01:45', subject: 'Computer Science', teacher: 'Deepak Verma', room: 'Lab-1' },
        { period: 6, time: '01:45 - 02:30', subject: 'Library / Reading', teacher: 'Mrs. Sen', room: 'Library' },
      ],
      saturday: [
        { period: 1, time: '09:00 - 09:45', subject: 'Mathematics Assessment', teacher: 'Rahul Sharma', room: 'A-204' },
        { period: 2, time: '09:45 - 10:30', subject: 'Science Quiz', teacher: 'Priya Nair', room: 'A-205' },
        { period: 3, time: '10:45 - 11:30', subject: 'Club Activity', teacher: 'Activity In-charge', room: 'Auditorium' },
        { period: 4, time: '11:30 - 12:15', subject: 'Zero Period Mentoring', teacher: 'Rahul Sharma', room: 'A-204' },
      ],
    };

    const previousClasses = [
      {
        date: 'Oct 05, 2026',
        period: 2,
        subject: 'Mathematics',
        teacher: 'Rahul Sharma',
        topic: 'Quadratic Equations: Derivation of Quadratic Formula',
        attendance: 'Present',
        homeworkStatus: 'Submitted',
        hasRecording: true,
      },
      {
        date: 'Oct 05, 2026',
        period: 1,
        subject: 'Science',
        teacher: 'Priya Nair',
        topic: 'Balancing Chemical Equations & Redox Reactions',
        attendance: 'Present',
        homeworkStatus: 'Due Tomorrow',
        hasRecording: true,
      },
      {
        date: 'Oct 04, 2026',
        period: 4,
        subject: 'English',
        teacher: 'Anita Roy',
        topic: 'Nelson Mandela: Long Walk to Freedom (Analysis)',
        attendance: 'Present',
        homeworkStatus: 'Completed',
        hasRecording: false,
      },
    ];

    return { weeklySchedule, previousClasses };
  }
}
