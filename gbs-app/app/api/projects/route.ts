import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, location } = body;

        const newProject = await prisma.project.create({
            data: {
                name,
                location,
            },
        });

        return NextResponse.json(newProject);
    } catch (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}