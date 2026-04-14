import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WorkerSalaryReport {
  worker_id: number;
  worker_name: string;
  worker_nic: string;
  daily_rate: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  total_salary: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const projectId = searchParams.get('project_id');

    // Validate required parameters
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year parameters are required' },
        { status: 400 }
      );
    }

    // Parse month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12 || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json(
        { error: 'Invalid month or year parameters' },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of month (will be adjusted by date logic)
    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0);

    // Build date filter
    const dateFilter = {
      gte: startOfMonth,
      lte: endOfMonth,
    };

    // Fetch all workers (optionally filtered by project)
    const workers = await prisma.workers.findMany({
      where: projectId ? { project_id: parseInt(projectId) } : {},
      include: {
        projects: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (workers.length === 0) {
      return NextResponse.json(
        { 
          message: 'No workers found',
          data: [],
          summary: {
            total_workers: 0,
            total_salary: 0,
            month: month,
            year: year
          }
        },
        { status: 200 }
      );
    }

    // Fetch attendance records for all workers in the specified month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: dateFilter,
        worker_id: {
          in: workers.map(w => w.id)
        }
      },
      include: {
        workers: {
          select: {
            id: true,
            name: true,
            nic: true,
            daily_rate: true,
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { worker_id: 'asc' }
      ]
    });

    // Calculate salary reports for each worker
    const salaryReports: WorkerSalaryReport[] = [];

    for (const worker of workers) {
      // Get attendance records for this worker
      const workerAttendance = attendanceRecords.filter(
        (record: any) => record.worker_id === worker.id
      );

      // Count attendance types
      const presentDays = workerAttendance.filter(
        (record: any) => record.status === 'Present'
      ).length;
      const absentDays = workerAttendance.filter(
        (record: any) => record.status === 'Absent'
      ).length;
      const halfDays = workerAttendance.filter(
        (record: any) => record.status === 'Half Day'
      ).length;

      // Calculate total salary
      // Present days = full daily rate
      // Half days = 50% of daily rate
      const totalSalary = (presentDays * Number(worker.daily_rate)) + (halfDays * Number(worker.daily_rate) * 0.5);

      salaryReports.push({
        worker_id: worker.id,
        worker_name: worker.name,
        worker_nic: worker.nic,
        daily_rate: Number(worker.daily_rate),
        present_days: presentDays,
        absent_days: absentDays,
        half_days: halfDays,
        total_salary: totalSalary,
      });
    }

    // Calculate summary statistics
    const totalWorkers = salaryReports.length;
    const totalPresentDays = salaryReports.reduce((sum, report) => sum + report.present_days, 0);
    const totalAbsentDays = salaryReports.reduce((sum, report) => sum + report.absent_days, 0);
    const totalHalfDays = salaryReports.reduce((sum, report) => sum + report.half_days, 0);
    const totalSalary = salaryReports.reduce((sum, report) => sum + report.total_salary, 0);

    return NextResponse.json({
      message: `Salary report generated for ${month}/${year}`,
      data: salaryReports,
      summary: {
        total_workers: totalWorkers,
        total_present_days: totalPresentDays,
        total_absent_days: totalAbsentDays,
        total_half_days: totalHalfDays,
        total_salary: totalSalary,
        month: month,
        year: year,
        project_id: projectId || 'all'
      },
      status: 200
    });

  } catch (error) {
    console.error('Salary report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate salary report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
