import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SendStudentMessageDto } from '../dto/student.dto';

@Injectable()
export class StudentCommunicationService {
  constructor(private readonly dataSource: DataSource) {}

  async getMessages(organizationId: string, studentUserId: string) {
    const messages = [
      {
        id: 'msg-1',
        senderName: 'Rahul Sharma (Math & Class Teacher)',
        senderRole: 'teacher',
        subjectLine: 'Feedback on Problem Set 2 & Mid-Term Prep',
        body: 'Well done on getting 18/20 in the last problem set. Make sure to review the word problems on upstream/downstream before the mid-term next week.',
        date: 'Oct 04, 2026',
        isRead: true,
        priority: 'normal',
      },
      {
        id: 'msg-2',
        senderName: 'Priya Nair (Science Teacher)',
        senderRole: 'teacher',
        subjectLine: 'Lab Practical Report Submission Window',
        body: 'Please ensure your lab observation notebooks are signed and submitted by Thursday afternoon.',
        date: 'Oct 03, 2026',
        isRead: false,
        priority: 'normal',
      },
      {
        id: 'msg-3',
        senderName: 'School Academic Office',
        senderRole: 'admin',
        subjectLine: 'Mid-Term Examination Date Sheet & Admit Cards',
        body: 'The Term 1 Mid-Term examination schedule for Classes 9 to 12 has been officially published. Admit cards will be distributed on Monday.',
        date: 'Oct 01, 2026',
        isRead: true,
        priority: 'urgent',
      },
    ];

    const teachersList = [
      { id: 't-rahul', name: 'Rahul Sharma', subject: 'Mathematics & Class Teacher' },
      { id: 't-priya', name: 'Priya Nair', subject: 'Science' },
      { id: 't-anita', name: 'Anita Roy', subject: 'English' },
      { id: 't-vikram', name: 'Vikram Joshi', subject: 'Social Science' },
      { id: 't-deepak', name: 'Deepak Verma', subject: 'Computer Applications' },
    ];

    return { messages, teachersList };
  }

  async sendMessage(organizationId: string, studentUserId: string, dto: SendStudentMessageDto) {
    return {
      success: true,
      message: 'Your message has been sent to your teacher.',
      messageId: 'msg-sent-new',
    };
  }
}
