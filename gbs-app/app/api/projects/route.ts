import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const projects = await prisma.projects.findMany({
      orderBy: { created_at: 'desc' }
    });
    console.log('Fetched projects:', projects.length);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received data:', body);
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    console.log('Attempting to create project...');
    
    const newProject = await prisma.projects.create({
      data: {
        name: body.name,
        location: body.location || null,
        status: body.status || "Ongoing"
      },
    });
    
    console.log('Project created successfully:', newProject);
    
    return NextResponse.json({
      success: true,
      project: newProject
    });
    
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { 
        error: 'Failed to create project', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}