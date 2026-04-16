import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');
    const projectId = searchParams.get('project_id');

    if (!workerId) {
      return NextResponse.json(
        { error: 'worker_id query parameter is required' },
        { status: 400 }
      );
    }

    const workerIdNum = parseInt(workerId);
    if (isNaN(workerIdNum) || workerIdNum <= 0) {
      return NextResponse.json(
        { error: 'worker_id must be a positive number' },
        { status: 400 }
      );
    }

    // Get worker details
    const worker = await (prisma as any).workers.findUnique({
      where: { id: workerIdNum }
    });

    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // Calculate total earnings from attendance
    let attendanceQuery: any = {
      worker_id: workerIdNum
    };

    if (projectId) {
      attendanceQuery.project_id = parseInt(projectId);
    }

    const attendanceRecords = await (prisma as any).attendance.findMany({
      where: attendanceQuery,
      include: {
        workers: {
          select: {
            daily_rate: true
          }
        }
      }
    });

    let totalEarned = 0;
    attendanceRecords.forEach((record: any) => {
      let daysWorked = 0;
      
      // Calculate based on workType
      switch (record.workType) {
        case 'Full':
          daysWorked = 1;
          break;
        case 'Half':
          daysWorked = 0.5;
          break;
        default:
          daysWorked = 0;
      }
      
      totalEarned += Number(record.workers.daily_rate) * daysWorked;
    });

    // Get transactions
    let transactionQuery: any = {
      workerId: workerIdNum
    };

    if (projectId) {
      transactionQuery.projectId = projectId ? parseInt(projectId) : null;
    }

    const transactions = await (prisma as any).workerTransaction.findMany({
      where: transactionQuery,
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate totals from transactions
    let totalAdvances = 0;
    let totalDeductions = 0;
    let totalBonuses = 0;

    transactions.forEach((transaction: any) => {
      const amount = Number(transaction.amount);
      switch (transaction.type) {
        case 'Advance':
          totalAdvances += amount;
          break;
        case 'Deduction':
          totalDeductions += amount;
          break;
        case 'Bonus':
          totalBonuses += amount;
          break;
      }
    });

    // Calculate final balance
    const finalBalance = totalEarned - totalAdvances - totalDeductions + totalBonuses;

    return NextResponse.json({
      worker: {
        id: worker.id,
        name: worker.name,
        nic: worker.nic,
        phone: worker.phone,
        daily_rate: worker.daily_rate
      },
      earnings: {
        totalEarned: totalEarned,
        totalAdvances: totalAdvances,
        totalDeductions: totalDeductions,
        totalBonuses: totalBonuses,
        finalBalance: finalBalance
      },
      transactions: transactions
    });
    
  } catch (error) {
    console.error("GET Worker Balance Error:", error);
    return NextResponse.json(
      { error: 'Failed to calculate worker balance' },
      { status: 500 }
    );
  }
}
