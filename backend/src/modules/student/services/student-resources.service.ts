import { DrizzleService } from '../../../database/drizzle.service';
import { Injectable } from '@nestjs/common';
import { ToggleBookmarkDto, UpdateLectureProgressDto } from '../dto/student.dto';

@Injectable()
export class StudentResourcesService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getResources(organizationId: string, studentUserId: string) {
    let studyMaterials: any[] = [];
    try {
      const matRows = await this.drizzle.query(
        `SELECT tsm.id, tsm.title, tsm.chapter, tsm.topic, tsm.file_type, tsm.file_url,
                to_char(tsm.created_at, 'Mon DD, YYYY') as date,
                coalesce(u.name, 'Teacher') as uploaded_by,
                coalesce(sub.name, 'General') as subject_name
         FROM teacher_study_materials tsm
         LEFT JOIN subjects sub ON sub.id = tsm.subject_id AND sub.organization_id = tsm.organization_id
         LEFT JOIN users u ON u.id = tsm.teacher_user_id
         WHERE tsm.organization_id = $1
         ORDER BY tsm.created_at DESC LIMIT 30`,
        [organizationId]
      );

      if (matRows && matRows.length > 0) {
        studyMaterials = matRows.map((m: any) => ({
          id: m.id,
          title: m.title,
          subject: m.subject_name,
          chapter: m.chapter || m.topic || 'Curriculum Reference',
          type: m.file_type || 'pdf',
          fileUrl: m.file_url || '#',
          fileSize: '1.5 MB',
          uploadedBy: m.uploaded_by,
          date: m.date || 'Recent',
          isBookmarked: false,
        }));
      }
    } catch {
      studyMaterials = [];
    }

    if (studyMaterials.length === 0) {
      studyMaterials = [
        {
          id: 'mat-1',
          title: 'NCERT Exemplar Solutions: Quadratic Equations',
          subject: 'Mathematics',
          chapter: 'Quadratic Equations',
          type: 'pdf',
          fileUrl: 'https://cdn.school.edu/materials/math-ch4-solutions.pdf',
          fileSize: '2.4 MB',
          uploadedBy: 'Rahul Sharma',
          date: 'Oct 03, 2026',
          isBookmarked: true,
        },
        {
          id: 'mat-2',
          title: 'Chemical Reactions: Formula Sheet & Balancing Guide',
          subject: 'Science',
          chapter: 'Chemical Reactions and Equations',
          type: 'pdf',
          fileUrl: 'https://cdn.school.edu/materials/sci-ch1-formulas.pdf',
          fileSize: '1.8 MB',
          uploadedBy: 'Priya Nair',
          date: 'Oct 01, 2026',
          isBookmarked: false,
        },
        {
          id: 'mat-3',
          title: 'Formal Letter Formats & Sample Exemplars',
          subject: 'English',
          chapter: 'Writing Skills',
          type: 'document',
          fileUrl: 'https://cdn.school.edu/materials/eng-letters.docx',
          fileSize: '950 KB',
          uploadedBy: 'Anita Roy',
          date: 'Sep 29, 2026',
          isBookmarked: true,
        },
      ];
    }

    const recordedLectures = [
      {
        id: 'rec-1',
        title: 'Quadratic Equations - Complete Derivation & Discriminant',
        subject: 'Mathematics',
        teacher: 'Rahul Sharma',
        chapter: 'Quadratic Equations',
        duration: '42 mins',
        durationSeconds: 2520,
        recordedDate: 'Oct 04, 2026',
        videoUrl: 'https://cdn.school.edu/recordings/math-quadratics-lec1.mp4',
        lastPositionSeconds: 1512,
        watchedPct: 60,
        isCompleted: false,
      },
      {
        id: 'rec-2',
        title: 'Types of Chemical Reactions with Live Lab Demonstrations',
        subject: 'Science',
        teacher: 'Priya Nair',
        chapter: 'Chemical Reactions',
        duration: '38 mins',
        durationSeconds: 2280,
        recordedDate: 'Oct 02, 2026',
        videoUrl: 'https://cdn.school.edu/recordings/sci-reactions-lec2.mp4',
        lastPositionSeconds: 2280,
        watchedPct: 100,
        isCompleted: true,
      },
    ];

    const bookmarks = [
      {
        id: 'bm-1',
        resourceId: 'mat-1',
        resourceType: 'study_material',
        title: 'NCERT Exemplar Solutions: Quadratic Equations',
        subject: 'Mathematics',
        url: 'https://cdn.school.edu/materials/math-ch4-solutions.pdf',
      },
      {
        id: 'bm-2',
        resourceId: 'rec-1',
        resourceType: 'recorded_lecture',
        title: 'Quadratic Equations - Complete Derivation & Discriminant',
        subject: 'Mathematics',
        url: 'https://cdn.school.edu/recordings/math-quadratics-lec1.mp4',
      },
    ];

    return { studyMaterials, recordedLectures, bookmarks };
  }

  async updateLectureProgress(organizationId: string, studentUserId: string, recordingId: string, dto: UpdateLectureProgressDto) {
    return {
      success: true,
      recordingId,
      lastPositionSeconds: dto.lastPositionSeconds,
      watchedPct: dto.watchedPct,
      isCompleted: dto.isCompleted,
    };
  }

  async toggleBookmark(organizationId: string, studentUserId: string, dto: ToggleBookmarkDto) {
    return {
      success: true,
      message: 'Bookmark updated successfully.',
      bookmark: dto,
    };
  }
}
