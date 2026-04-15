import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define valid expense categories
const VALID_CATEGORIES = ['Material', 'Labor', 'Transport', 'Food', 'Other'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id parameter is required' },
        { status: 400 }
      );
    }

    const projectIdNum = parseInt(projectId);
    if (isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project_id parameter' },
        { status: 400 }
      );
    }

    // Fetch all expenses for the specified project
    const expenses = await prisma.expenses.findMany({
      where: {
        project_id: projectIdNum
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      message: `Found ${expenses.length} expenses for project ${projectIdNum}`,
      data: expenses,
      status: 200
    });

  } catch (error) {
    console.error('Expenses GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_name, amount, category, date, project_id } = body;

    // Validate required fields
    if (!item_name || !amount || !category || !date || !project_id) {
      return NextResponse.json(
        { error: 'Missing required fields: item_name, amount, category, date, project_id' },
        { status: 400 }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate project_id
    const projectIdNum = parseInt(project_id);
    if (isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: 'Invalid project_id' },
        { status: 400 }
      );
    }

    // Validate date
    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Create new expense
    const expense = await prisma.expenses.create({
      data: {
        item_name: item_name.trim(),
        amount: amountNum,
        category: category,
        date: expenseDate,
        project_id: projectIdNum
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Expense created successfully',
      data: expense,
      status: 201
    });

  } catch (error) {
    console.error('Expenses POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json(
        { error: 'expense id parameter is required' },
        { status: 400 }
      );
    }

    const expenseIdNum = parseInt(expenseId);
    if (isNaN(expenseIdNum)) {
      return NextResponse.json(
        { error: 'Invalid expense id' },
        { status: 400 }
      );
    }

    // Check if expense exists
    const existingExpense = await prisma.expenses.findUnique({
      where: {
        id: expenseIdNum
      }
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Delete the expense
    await prisma.expenses.delete({
      where: {
        id: expenseIdNum
      }
    });

    return NextResponse.json({
      message: 'Expense deleted successfully',
      data: { id: expenseIdNum },
      status: 200
    });

  } catch (error) {
    console.error('Expenses DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle unsupported HTTP methods
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
