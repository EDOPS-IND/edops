import { Module } from '@nestjs/common';
import { StudentGuard } from './guards/student.guard';

// Services
import { StudentDashboardService } from './services/student-dashboard.service';
import { StudentClassesService } from './services/student-classes.service';
import { StudentSubjectsService } from './services/student-subjects.service';
import { StudentTimetableService } from './services/student-timetable.service';
import { StudentAssignmentsService } from './services/student-assignments.service';
import { StudentArenaService } from './services/student-arena.service';
import { StudentAssessmentsService } from './services/student-assessments.service';
import { StudentExamsService } from './services/student-exams.service';
import { StudentAttendanceService } from './services/student-attendance.service';
import { StudentPerformanceService } from './services/student-performance.service';
import { StudentCurriculumService } from './services/student-curriculum.service';
import { StudentResourcesService } from './services/student-resources.service';
import { StudentCommunicationService } from './services/student-communication.service';
import { StudentProgressService } from './services/student-progress.service';

// Controllers
import { StudentDashboardController } from './controllers/student-dashboard.controller';
import { StudentClassesController } from './controllers/student-classes.controller';
import { StudentSubjectsController } from './controllers/student-subjects.controller';
import { StudentTimetableController } from './controllers/student-timetable.controller';
import { StudentAssignmentsController } from './controllers/student-assignments.controller';
import { StudentArenaController } from './controllers/student-arena.controller';
import { StudentAssessmentsController } from './controllers/student-assessments.controller';
import { StudentExamsController } from './controllers/student-exams.controller';
import { StudentAttendanceController } from './controllers/student-attendance.controller';
import { StudentPerformanceController } from './controllers/student-performance.controller';
import { StudentCurriculumController } from './controllers/student-curriculum.controller';
import { StudentResourcesController } from './controllers/student-resources.controller';
import { StudentCommunicationController } from './controllers/student-communication.controller';
import { StudentProgressController } from './controllers/student-progress.controller';

@Module({
  controllers: [
    StudentDashboardController,
    StudentClassesController,
    StudentSubjectsController,
    StudentTimetableController,
    StudentAssignmentsController,
    StudentArenaController,
    StudentAssessmentsController,
    StudentExamsController,
    StudentAttendanceController,
    StudentPerformanceController,
    StudentCurriculumController,
    StudentResourcesController,
    StudentCommunicationController,
    StudentProgressController,
  ],
  providers: [
    StudentGuard,
    StudentDashboardService,
    StudentClassesService,
    StudentSubjectsService,
    StudentTimetableService,
    StudentAssignmentsService,
    StudentArenaService,
    StudentAssessmentsService,
    StudentExamsService,
    StudentAttendanceService,
    StudentPerformanceService,
    StudentCurriculumService,
    StudentResourcesService,
    StudentCommunicationService,
    StudentProgressService,
  ],
  exports: [
    StudentDashboardService,
    StudentClassesService,
    StudentSubjectsService,
    StudentTimetableService,
    StudentAssignmentsService,
    StudentArenaService,
    StudentAssessmentsService,
    StudentExamsService,
    StudentAttendanceService,
    StudentPerformanceService,
    StudentCurriculumService,
    StudentResourcesService,
    StudentCommunicationService,
    StudentProgressService,
  ],
})
export class StudentModule {}
