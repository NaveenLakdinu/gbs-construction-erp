import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');
    const projectId = searchParams.get('project_id');

    let whereClause: any = {};

    if (workerId) {
      whereClause.workerId = parseInt(workerId);
    }

    if (projectId) {
      whereClause.projectId = projectId ? parseInt(projectId) : null;
    }

    const transactions = await (prisma as any).workerTransaction.findMany({
      where: whereClause,
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
        date: 'desc'
      }
    });

    return NextResponse.json(transactions);
    
  } catch (error) {
    console.error("GET Worker Transactions Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch worker transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.workerId || !body.type || !body.amount) {
      return NextResponse.json(
        { error: 'workerId, type, and amount are required' },
        { status: 400 }
      );
    }

    // Validate workerId
    const workerId = parseInt(body.workerId);
    if (isNaN(workerId) || workerId <= 0) {
      return NextResponse.json(
        { error: 'workerId must be a positive number' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['Advance', 'Deduction', 'Bonus'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: Advance, Deduction, or Bonus' },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate projectId (optional)
    let projectId = null;
    if (body.projectId && body.projectId !== '') {
      projectId = parseInt(body.projectId);
      if (isNaN(projectId) || projectId <= 0) {
        return NextResponse.json(
          { error: 'projectId must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Check if worker exists
    const worker = await (prisma as any).workers.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // If projectId is provided, check if project exists
    if (projectId) {
      const project = await (prisma as any).projects.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // Create worker transaction
    const transaction = await (prisma as any).workerTransaction.create({
      data: {
        workerId: workerId,
        projectId: projectId,
        amount: amount,
        type: body.type,
        note: body.note || null,
        date: body.date ? new Date(body.date) : new Date()
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
        projects: projectId ? {
          select: {
            id: true,
            name: true
          }
        } : false
      }
    });

    return NextResponse.json(transaction);
    
  } catch (error) {
    console.error("POST Worker Transaction Error:", error);
    return NextResponse.json(
      { error: 'Failed to create worker transaction' },
      { status: 500 }
    );
  }
}
