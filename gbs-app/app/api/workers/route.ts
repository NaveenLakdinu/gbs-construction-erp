import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const workers = await prisma.workers.findMany({
      include: {
        projects: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return NextResponse.json(workers);
  } catch (error) {
    console.error("GET Workers Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.nic || !body.phone || !body.daily_rate || !body.project_id) {
      return NextResponse.json(
        { error: 'All fields are required: name, nic, phone, daily_rate, project_id' },
        { status: 400 }
      );
    }

    // Validate NIC format (basic validation)
    if (body.nic.length < 10 || body.nic.length > 20) {
      return NextResponse.json(
        { error: 'NIC must be between 10 and 20 characters' },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    if (body.phone.length < 10 || body.phone.length > 20) {
      return NextResponse.json(
        { error: 'Phone number must be between 10 and 20 characters' },
        { status: 400 }
      );
    }

    // Validate daily_rate is a positive number
    const dailyRate = parseFloat(body.daily_rate);
    if (isNaN(dailyRate) || dailyRate <= 0) {
      return NextResponse.json(
        { error: 'Daily rate must be a positive number' },
        { status: 400 }
      );
    }

    // Validate project_id is a positive integer
    const projectId = parseInt(body.project_id);
    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: 'Project ID must be a positive number' },
        { status: 400 }
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

    // Check if NIC already exists
    const existingWorker = await prisma.workers.findUnique({
      where: { nic: body.nic }
    });

    if (existingWorker) {
      return NextResponse.json(
        { error: 'Worker with this NIC already exists' },
        { status: 409 }
      );
    }

    const newWorker = await prisma.workers.create({
      data: {
        name: body.name,
        nic: body.nic,
        phone: body.phone,
        daily_rate: dailyRate,
        project_id: projectId
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return NextResponse.json(newWorker);
    
  } catch (error) {
    console.error("POST Workers Error:", error);
    return NextResponse.json(
      { error: 'Failed to create worker' },
      { status: 500 }
    );
  }
}
