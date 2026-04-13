import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const date = searchParams.get('date');

    // Validate required parameters
    if (!projectId || !date) {
      return NextResponse.json(
        { error: 'project_id and date query parameters are required' },
        { status: 400 }
      );
    }

    // Validate project_id is a number
    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum) || projectIdNum <= 0) {
      return NextResponse.json(
        { error: 'project_id must be a positive number' },
        { status: 400 }
      );
    }

    // Validate date format
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO format (e.g., 2024-04-13)' },
        { status: 400 }
      );
    }

    // Get attendance records for specific project and date with worker details
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        project_id: projectIdNum,
        date: {
          gte: new Date(attendanceDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          lt: new Date(attendanceDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
        }
      },
      include: {
        workers: {
          select: {
            id: true,
            name: true,
            nic: true,
            phone: true,
            daily_rate: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        workers: {
          name: 'asc'
        }
      }
    });

    return NextResponse.json(attendanceRecords);
    
  } catch (error) {
    console.error("GET Attendance Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.worker_id || !body.project_id || !body.date || !body.status) {
      return NextResponse.json(
        { error: 'worker_id, project_id, date, and status are required' },
        { status: 400 }
      );
    }

    // Validate worker_id
    const workerId = parseInt(body.worker_id);
    if (isNaN(workerId) || workerId <= 0) {
      return NextResponse.json(
        { error: 'worker_id must be a positive number' },
        { status: 400 }
      );
    }

    // Validate project_id
    const projectId = parseInt(body.project_id);
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'project_id must be a positive number' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['Present', 'Absent', 'Half Day'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: Present, Absent, or Half Day' },
        { status: 400 }
      );
    }

    // Validate date
    const attendanceDate = new Date(body.date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO format (e.g., 2024-04-13)' },
        { status: 400 }
      );
    }

    // Check if worker exists
    const worker = await prisma.workers.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // Check if project exists
    const project = await prisma.projects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Upsert attendance record (create or update)
    const attendanceRecord = await prisma.attendance.upsert({
      where: {
        worker_id_date: {
          worker_id: workerId,
          date: new Date(attendanceDate.toISOString().split('T')[0] + 'T00:00:00.000Z')
        }
      },
      update: {
        status: body.status,
        project_id: projectId
      },
      create: {
        worker_id: workerId,
        project_id: projectId,
        date: new Date(attendanceDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        status: body.status
      },
      include: {
        workers: {
          select: {
            id: true,
            name: true,
            nic: true,
            phone: true,
            daily_rate: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(attendanceRecord);
    
  } catch (error) {
    console.error("POST Attendance Error:", error);
    return NextResponse.json(
      { error: 'Failed to save attendance record' },
      { status: 500 }
    );
  }
}
