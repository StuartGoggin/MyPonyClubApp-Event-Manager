import { adminDb } from './firebase-admin';
import { BackupSchedule, BackupExecution, BackupStats, ScheduleConfig } from './types-backup';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const BACKUP_SCHEDULES_COLLECTION = 'backupSchedules';
const BACKUP_EXECUTIONS_COLLECTION = 'backupExecutions';

export class BackupScheduleService {
  /**
   * Create a new backup schedule
   */
  static async createSchedule(
    scheduleData: Omit<BackupSchedule, 'id' | 'createdAt' | 'updatedAt' | 'totalRuns' | 'successfulRuns' | 'failedRuns'>,
    createdBy: string
  ): Promise<BackupSchedule> {
    try {
      const now = new Date();
      const schedule: BackupSchedule = {
        ...scheduleData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        createdBy,
        nextRun: this.calculateNextRun(scheduleData.schedule)
      };

      await adminDb.collection(BACKUP_SCHEDULES_COLLECTION).doc(schedule.id).set({
        ...schedule,
        createdAt: now,
        updatedAt: now,
        nextRun: schedule.nextRun
      });

      return schedule;
    } catch (error) {
      console.error('Error creating backup schedule:', error);
      throw new Error('Failed to create backup schedule');
    }
  }

  /**
   * Get all backup schedules
   */
  static async getSchedules(): Promise<BackupSchedule[]> {
    try {
      const snapshot = await adminDb.collection(BACKUP_SCHEDULES_COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastRun: data.lastRun?.toDate(),
          nextRun: data.nextRun?.toDate()
        } as BackupSchedule;
      });
    } catch (error) {
      console.error('Error getting backup schedules:', error);
      throw new Error('Failed to retrieve backup schedules');
    }
  }

  /**
   * Get a single backup schedule by ID
   */
  static async getScheduleById(scheduleId: string): Promise<BackupSchedule | null> {
    try {
      const doc = await adminDb.collection(BACKUP_SCHEDULES_COLLECTION).doc(scheduleId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastRun: data.lastRun?.toDate(),
        nextRun: data.nextRun?.toDate()
      } as BackupSchedule;
    } catch (error) {
      console.error('Error getting backup schedule:', error);
      throw new Error('Failed to retrieve backup schedule');
    }
  }

  /**
   * Update a backup schedule
   */
  static async updateSchedule(
    scheduleId: string, 
    updates: Partial<Omit<BackupSchedule, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<BackupSchedule> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // Recalculate next run if schedule config changed
      if (updates.schedule) {
        updateData.nextRun = this.calculateNextRun(updates.schedule);
      }

      await adminDb.collection(BACKUP_SCHEDULES_COLLECTION).doc(scheduleId).update(updateData);

      const updatedSchedule = await this.getScheduleById(scheduleId);
      if (!updatedSchedule) {
        throw new Error('Schedule not found after update');
      }

      return updatedSchedule;
    } catch (error) {
      console.error('Error updating backup schedule:', error);
      throw new Error('Failed to update backup schedule');
    }
  }

  /**
   * Delete a backup schedule
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await adminDb.collection(BACKUP_SCHEDULES_COLLECTION).doc(scheduleId).delete();
    } catch (error) {
      console.error('Error deleting backup schedule:', error);
      throw new Error('Failed to delete backup schedule');
    }
  }

  /**
   * Get active schedules that need to run
   */
  static async getSchedulesDueForExecution(): Promise<BackupSchedule[]> {
    try {
      const now = new Date();
      const snapshot = await adminDb.collection(BACKUP_SCHEDULES_COLLECTION)
        .where('isActive', '==', true)
        .where('nextRun', '<=', now)
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastRun: data.lastRun?.toDate(),
          nextRun: data.nextRun?.toDate()
        } as BackupSchedule;
      });
    } catch (error) {
      console.error('Error getting schedules due for execution:', error);
      throw new Error('Failed to retrieve schedules due for execution');
    }
  }

  /**
   * Record a backup execution
   */
  static async recordExecution(execution: Omit<BackupExecution, 'id'>): Promise<BackupExecution> {
    try {
      const executionWithId = {
        ...execution,
        id: uuidv4()
      };

      await adminDb.collection(BACKUP_EXECUTIONS_COLLECTION).doc(executionWithId.id).set({
        ...executionWithId,
        startTime: execution.startTime,
        endTime: execution.endTime
      });

      // Update schedule stats
      const scheduleRef = adminDb.collection(BACKUP_SCHEDULES_COLLECTION).doc(execution.scheduleId);
      const scheduleDoc = await scheduleRef.get();
      
      if (scheduleDoc.exists) {
        const scheduleData = scheduleDoc.data()!;
        const updates: any = {
          lastRun: execution.startTime,
          totalRuns: (scheduleData.totalRuns || 0) + 1,
          updatedAt: new Date()
        };

        if (execution.status === 'completed') {
          updates.successfulRuns = (scheduleData.successfulRuns || 0) + 1;
        } else if (execution.status === 'failed') {
          updates.failedRuns = (scheduleData.failedRuns || 0) + 1;
        }

        // Calculate next run
        updates.nextRun = this.calculateNextRun(scheduleData.schedule);

        await scheduleRef.update(updates);
      }

      return executionWithId;
    } catch (error) {
      console.error('Error recording backup execution:', error);
      throw new Error('Failed to record backup execution');
    }
  }

  /**
   * Get backup executions for a schedule
   */
  static async getExecutions(scheduleId?: string, limit: number = 50): Promise<BackupExecution[]> {
    try {
      let query = adminDb.collection(BACKUP_EXECUTIONS_COLLECTION)
        .orderBy('startTime', 'desc')
        .limit(limit);

      if (scheduleId) {
        query = query.where('scheduleId', '==', scheduleId);
      }

      const snapshot = await query.get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate()
        } as BackupExecution;
      });
    } catch (error) {
      console.error('Error getting backup executions:', error);
      throw new Error('Failed to retrieve backup executions');
    }
  }

  /**
   * Get backup statistics
   */
  static async getBackupStats(): Promise<BackupStats> {
    try {
      const [schedulesSnapshot, executionsSnapshot] = await Promise.all([
        adminDb.collection(BACKUP_SCHEDULES_COLLECTION).get(),
        adminDb.collection(BACKUP_EXECUTIONS_COLLECTION).orderBy('startTime', 'desc').limit(100).get()
      ]);

      const schedules = schedulesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());
      const executions = executionsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          ...data,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate()
        };
      });

      const activeSchedules = schedules.filter((s: any) => s.isActive).length;
      
      const successfulExecutionsList = executions.filter((e: any) => e.status === 'completed');
      const successfulExecutions = successfulExecutionsList.length;
      const failedExecutions = executions.filter((e: any) => e.status === 'failed').length;

      const lastSuccessfulBackup = successfulExecutionsList.length > 0
        ? successfulExecutionsList
            .sort((a: any, b: any) => {
              const aTime = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
              const bTime = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
              return bTime.getTime() - aTime.getTime();
            })[0]?.startTime
        : undefined;

      const activeSchedulesWithNextRun = schedules.filter((s: any) => s.isActive && s.nextRun);
      const nextScheduledBackup = activeSchedulesWithNextRun.length > 0
        ? activeSchedulesWithNextRun
            .sort((a: any, b: any) => {
              const aTime = a.nextRun instanceof Date ? a.nextRun : new Date(a.nextRun);
              const bTime = b.nextRun instanceof Date ? b.nextRun : new Date(b.nextRun);
              return aTime.getTime() - bTime.getTime();
            })[0]?.nextRun
        : undefined;

      const totalBackupSize = executions
        .filter((e: any) => e.exportSize)
        .reduce((sum: number, e: any) => sum + (e.exportSize || 0), 0);

      const completedExecutions = executions.filter((e: any) => e.status === 'completed' && e.metadata?.executionDuration);
      const averageBackupTime = completedExecutions.length > 0
        ? completedExecutions.reduce((sum: number, e: any) => sum + (e.metadata?.executionDuration || 0), 0) / completedExecutions.length
        : 0;

      return {
        totalSchedules: schedules.length,
        activeSchedules,
        totalExecutions: executions.length,
        successfulExecutions,
        failedExecutions,
        lastSuccessfulBackup,
        nextScheduledBackup,
        totalBackupSize,
        averageBackupTime
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      throw new Error('Failed to retrieve backup statistics');
    }
  }

  /**
   * Calculate the next run time for a schedule
   */
  private static calculateNextRun(schedule: ScheduleConfig): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, move to the next occurrence
    if (nextRun <= now) {
      switch (schedule.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          const daysUntilWeekday = (7 + (schedule.weekday || 0) - nextRun.getDay()) % 7;
          nextRun.setDate(nextRun.getDate() + (daysUntilWeekday || 7));
          break;
        case 'monthly':
          if (schedule.dayOfMonth) {
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setDate(schedule.dayOfMonth);
          }
          break;
        case 'custom':
          // For custom cron expressions, this would need a proper cron parser
          // For now, default to daily
          nextRun.setDate(nextRun.getDate() + 1);
          break;
      }
    }

    return nextRun;
  }

  /**
   * Toggle schedule active status
   */
  static async toggleScheduleStatus(scheduleId: string): Promise<BackupSchedule> {
    try {
      const schedule = await this.getScheduleById(scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      return await this.updateSchedule(scheduleId, {
        isActive: !schedule.isActive,
        nextRun: !schedule.isActive ? this.calculateNextRun(schedule.schedule) : undefined
      });
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      throw new Error('Failed to toggle schedule status');
    }
  }
}