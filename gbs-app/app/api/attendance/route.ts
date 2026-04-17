import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const date = searchParams.get('date');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      return NextResponse.json({ error: 'Invalid project_id' }, { status: 400 });
    }

    let attendanceRecords;

    if (date) {
      const attendanceDate = new Date(date);
      attendanceRecords = await (prisma as any).attendance.findMany({
        where: {
          project_id: projectIdNum,
          date: {
            gte: new Date(attendanceDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
            lt: new Date(attendanceDate.toISOString().split('T')[0] + 'T23:59:59.999Z')
          }
        },
        include: { workers: true, projects: true },
        orderBy: { workers: { name: 'asc' } }
      });
    } else {
      attendanceRecords = await (prisma as any).attendance.findMany({
        where: { project_id: projectIdNum },
        include: { workers: true, projects: true },
        orderBy: { date: 'desc' }
      });
    }

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Parse numeric values properly to prevent 500 errors
    const workerId = parseInt(body.worker_id);
    const projectId = parseInt(body.project_id);
    const dailyRate = parseFloat(body.dailyRate);
    const amountEarned = parseFloat(body.amountEarned);
    const amountPaid = parseFloat(body.amountPaid);
    const attendanceDate = new Date(body.date);

    // 2. Validation
    if (!workerId || !projectId || isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    // 3. Database Operation
    const attendanceRecord = await (prisma as any).attendance.create({
      data: {
        worker_id: workerId,
        project_id: projectId,
        date: new Date(attendanceDate.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        status: body.status,
        workType: body.workType,
        dailyRate: dailyRate,
        amountEarned: amountEarned,
        amountPaid: amountPaid,
        note: body.note || null
      },
      include: {
        workers: true,
        projects: true
      }
    });

    return NextResponse.json(attendanceRecord, { status: 201 });
  } catch (error: any) {
    console.error('POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}