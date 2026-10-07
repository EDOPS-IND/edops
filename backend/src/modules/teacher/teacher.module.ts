import { Module } from '@nestjs/common';
import { TeacherDashboardController } from './controllers/teacher-dashboard.controller';
import { TeacherClassesController } from './controllers/teacher-classes.controller';
import { TeacherTimetableController } from './controllers/teacher-timetable.controller';
import { TeacherAttendanceController } from './controllers/teacher-attendance.controller';
import { TeacherLearningController } from './controllers/teacher-learning.controller';
import { TeacherAssignmentsController } from './controllers/teacher-assignments.controller';
import { TeacherArenaController } from './controllers/teacher-arena.controller';
import { TeacherAssessmentsController } from './controllers/teacher-assessments.controller';
import { TeacherStudentsController } from './controllers/teacher-students.controller';
import { TeacherCurriculumController } from './controllers/teacher-curriculum.controller';
import { TeacherCommunicationController } from './controllers/teacher-communication.controller';
import { TeacherWorkloadReportsController } from './controllers/teacher-workload-reports.controller';

import { TeacherDashboardService } from './services/teacher-dashboard.service';
import { TeacherClassesService } from './services/teacher-classes.service';
import { TeacherTimetableService } from './services/teacher-timetable.service';
import { TeacherAttendanceService } from './services/teacher-attendance.service';
import { TeacherLearningService } from './services/teacher-learning.service';
import { TeacherAssignmentsService } from './services/teacher-assignments.service';
import { TeacherArenaService } from './services/teacher-arena.service';
import { TeacherAssessmentsService } from './services/teacher-assessments.service';
import { TeacherStudentsService } from './services/teacher-students.service';
import { TeacherCurriculumService } from './services/teacher-curriculum.service';
import { TeacherCommunicationService } from './services/teacher-communication.service';
import { TeacherWorkloadReportsService } from './services/teacher-workload-reports.service';

@Module({
  controllers: [
    TeacherDashboardController,
    TeacherClassesController,
    TeacherTimetableController,
    TeacherAttendanceController,
    TeacherLearningController,
    TeacherAssignmentsController,
    TeacherArenaController,
    TeacherAssessmentsController,
    TeacherStudentsController,
    TeacherCurriculumController,
    TeacherCommunicationController,
    TeacherWorkloadReportsController,
  ],
  providers: [
    TeacherDashboardService,
    TeacherClassesService,
    TeacherTimetableService,
    TeacherAttendanceService,
    TeacherLearningService,
    TeacherAssignmentsService,
    TeacherArenaService,
    TeacherAssessmentsService,
    TeacherStudentsService,
    TeacherCurriculumService,
    TeacherCommunicationService,
    TeacherWorkloadReportsService,
  ],
  exports: [
    TeacherDashboardService,
    TeacherClassesService,
    TeacherTimetableService,
    TeacherAttendanceService,
    TeacherLearningService,
    TeacherAssignmentsService,
    TeacherArenaService,
    TeacherAssessmentsService,
    TeacherStudentsService,
    TeacherCurriculumService,
    TeacherCommunicationService,
    TeacherWorkloadReportsService,
  ],
})
export class TeacherModule {}
