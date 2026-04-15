import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = await prisma.projects.findMany({
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(projects); 
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const newProject = await prisma.projects.create({
      data: {
        name: body.name,
        location: body.location || null,
        budget: parseFloat(body.budget) || 0,
        status: "Ongoing"
      },
    });
    
    return NextResponse.json(newProject);
    
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}